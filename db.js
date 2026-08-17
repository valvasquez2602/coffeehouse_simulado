const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const USERS_CSV = path.join(__dirname, 'data', 'usuarios.csv');
const ACTIVITIES_CSV = path.join(__dirname, 'data', 'atividades.csv');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'YamahaV1r4g0';
const DB_NAME = process.env.DB_NAME || 'ecomove';
// Banco usado apenas para conectar como admin e verificar/criar o DB_NAME.
// No Postgres normalmente é o banco padrão "postgres".
const DB_ADMIN_DATABASE = process.env.DB_ADMIN_DATABASE || 'postgres';

let pool;

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const [header, ...lines] = raw.split(/\r?\n/);
  const keys = header.split(',').map((k) => k.trim());
  return lines.map((line) => {
    const values = line.split(',');
    return keys.reduce((acc, key, index) => {
      acc[key] = (values[index] || '').trim();
      return acc;
    }, {});
  });
}

// Converte placeholders no estilo MySQL ("?") para o estilo do Postgres ($1, $2, ...)
function toPgQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

async function run(sql, params = []) {
  const result = await pool.query(toPgQuery(sql), params);
  return result;
}

async function all(sql, params = []) {
  const result = await pool.query(toPgQuery(sql), params);
  return result.rows;
}

async function get(sql, params = []) {
  const result = await pool.query(toPgQuery(sql), params);
  return result.rows[0];
}

async function ensureDatabaseExists() {
  const adminPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_ADMIN_DATABASE,
  });

  try {
    const { rows } = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
    if (rows.length === 0) {
      // Nomes de banco não podem ser parametrizados; DB_NAME vem de env/config confiável.
      await adminPool.query(`CREATE DATABASE "${DB_NAME}"`);
    }
  } finally {
    await adminPool.end();
  }
}

async function initDb() {
  await ensureDatabaseExists();

  pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    max: 10,
  });

  await run(`
    CREATE TABLE IF NOT EXISTS empresa (
      id INT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      url_logo VARCHAR(255) NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(180) NOT NULL UNIQUE,
      senha VARCHAR(120) NOT NULL,
      url_foto VARCHAR(255) NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS atividades (
      id INT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('bicicleta', 'caminhada', 'transporte_publico')),
      distancia_metros INT NOT NULL,
      duracao_minutos INT NOT NULL,
      co2_kg DECIMAL(10, 2) NOT NULL,
      data_criacao TIMESTAMP NOT NULL,
      CONSTRAINT fk_atividade_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS curtidas (
      usuario_id INT NOT NULL,
      atividade_id INT NOT NULL,
      PRIMARY KEY (usuario_id, atividade_id),
      CONSTRAINT fk_curtida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      CONSTRAINT fk_curtida_atividade FOREIGN KEY (atividade_id) REFERENCES atividades(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS comentarios (
      id SERIAL PRIMARY KEY,
      usuario_id INT NOT NULL,
      atividade_id INT NOT NULL,
      conteudo TEXT NOT NULL,
      data_criacao TIMESTAMP NOT NULL,
      CONSTRAINT fk_comentario_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      CONSTRAINT fk_comentario_atividade FOREIGN KEY (atividade_id) REFERENCES atividades(id)
    )
  `);

  const empresa = await get('SELECT id FROM empresa LIMIT 1');
  if (!empresa) {
    await run('INSERT INTO empresa (id, nome, url_logo) VALUES (1, ?, ?)', [
      'EcoMove',
      'https://api.dicebear.com/9.x/shapes/svg?seed=ecomove',
    ]);
  }

  const usuariosCount = await get('SELECT COUNT(*) AS quantidade FROM usuarios');
  if (Number(usuariosCount.quantidade) === 0) {
    const usuarios = parseCsv(USERS_CSV);
    for (const usuario of usuarios) {
      await run('INSERT INTO usuarios (id, nome, email, senha, url_foto) VALUES (?, ?, ?, ?, ?)', [
        Number(usuario.id),
        usuario.nome,
        usuario.email,
        usuario.senha,
        usuario.foto_url,
      ]);
    }
  }

  const atividadesCount = await get('SELECT COUNT(*) AS quantidade FROM atividades');
  if (Number(atividadesCount.quantidade) === 0) {
    const atividades = parseCsv(ACTIVITIES_CSV);
    for (const atividade of atividades) {
      await run(
        `INSERT INTO atividades
          (id, usuario_id, tipo, distancia_metros, duracao_minutos, co2_kg, data_criacao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(atividade.id),
          Number(atividade.usuario_id),
          atividade.tipo,
          Number(atividade.distancia_metros),
          Number(atividade.duracao_minutos),
          Number(atividade.co2_kg),
          new Date(atividade.data_iso),
        ]
      );
    }
  }
}

module.exports = {
  run,
  get,
  all,
  initDb,
};
