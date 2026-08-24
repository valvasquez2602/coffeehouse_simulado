# ☕ CoffeeHouse - Sistema Web de Pedidos e Interações

Este projeto consiste em um sistema web completo (Single Page Application - SPA) desenvolvido para a empresa **CoffeeHouse**. A plataforma funciona de forma dinâmica, permitindo que os usuários visualizem produtos (cafés, lanches e sobremesas), realizem pedidos e interajam com a comunidade através de curtidas e comentários em tempo real, sem a necessidade de atualizar a página.

O projeto foi construído seguindo rigorosamente o caderno de especificações técnicas, regras de negócio e a identidade visual padrão do SAEP.

---

## 🛠️ Tecnologias Utilizadas

Para garantir um sistema fluido, robusto e de fácil manutenção, foram utilizadas as seguintes tecnologias:

*   **Frontend:** HTML5, CSS3 (Layout bidimensional com Grid e Flexbox) e JavaScript Assíncrono (Vanilla JS / Fetch API) para a dinâmica de SPA.
*   **Backend:** PHP (estruturado para API/rotas que servem os dados persistidos).
*   **Banco de Dados:** MySQL (modelagem relacional com integridade de dados).
*   **Formatos de Arquivos:** PDF para documentação estrutural e SQL para o script do banco.

---

## 📐 Como o Projeto Foi Desenvolvido (Passo a Passo)

O desenvolvimento foi dividido em três etapas lógicas principais, focando em organização e prazos:

### 1. Modelagem e Banco de Dados (Back-end)
*   **Estrutura Relacional:** Primeiro, foi feita a modelagem das tabelas no formato `.PDF` mapeando os colaboradores, clientes, produtos, pedidos e as interações (likes e comentários).
*   **Construção do Banco:** Foi gerado o script `.SQL` com todas as chaves primárias (PK) e estrangeiras (FK) necessárias para garantir a integridade referencial.
*   **Importação de Dados:** Criou-se uma rotina para ler e importar os dados iniciais dos arquivos obrigatórios `atividades.csv` e `usuarios.csv` diretamente para o banco de dados recém-criado.

### 2. Interface Computacional e Identidade Visual (Front-end)
*   **Layout:** O corpo da página foi dividido em duas colunas principais utilizando CSS Grid:
    *   **Coluna 1 (Sidebar):** Painel de perfil com cor `#4b2c25`, contendo a logo da empresa, nome, contadores dinâmicos de pedidos/valores e o rodapé institucional fixado na parte inferior.
    *   **Coluna 2 (Main):** Área principal com cabeçalho de login/logout, filtros centralizados (`#6f493d`) e a listagem dos cards de produtos (`#fff8dc`).
*   **Tipografia e Cores:** Aplicação estrita da fonte *Inter* e da paleta hexadecimal fornecida (como `#a94442` para ações perigosas/exclusão e `#f3e7d8` para o fundo geral).

### 3. Regras de Negócio e Dinâmica SPA (JavaScript)
*   **Controle de Acesso:** Usuários não logados possuem funções desabilitadas. Se tentarem interagir, um modal de login é disparado.
*   **Validação de Formulários:** O sistema valida campos vazios ou credenciais incorretas em tempo real, aplicando bordas vermelhas nos inputs e mensagens de alerta amigáveis.
*   **Interações Dinâmicas:** 
    *   **Curtidas:** Incremento/decremento limitado a 1 por usuário em cada item, alternando a cor do ícone (`coração.svg`) entre vermelho (`#FF0000`) e branco.
    *   **Comentários:** Validação para impedir comentários com menos de 2 caracteres ou vazios.
    *   **Paginação e Filtros:** Limite rígido de 4 itens por tela, com estados ativo/inativo bem definidos nos botões de navegação, persistindo as seleções sem recarregar o navegador.

---

## 🎨 Resumo da Paleta de Cores Aplicada

| Componente / Uso | Cor Hexadecimal |
| :--- | :--- |
| **Fundo Geral** | `#f3e7d8` |
| **Barra Lateral (Sidebar)** | `#4b2c25` |
| **Botões e Filtros** | `#6f493d` |
| **Cards de Produtos** | `#fff8dc` |
| **Bordas Suaves** | `#b89b85` |
| **Ações Perigosas / Erros / Botão Sair** | `#a94442` |
| **Texto Principal** | `#2b1008` |

---

## 🚀 Como Executar o Projeto Localmente

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com
    ```
2.  **Configurar o Banco de Dados:**
    *   Importe o arquivo `database/coffeehouse.sql` no seu gerenciador MySQL (ex: phpMyAdmin).
    *   Certifique-se de que os dados dos arquivos `.csv` foram povoados corretamente.
3.  **Configurar o Servidor Local:**
    *   Mova a pasta do projeto para o diretório do seu servidor local (ex: `htdocs` no XAMPP ou `www` no WampServer).
4.  **Acessar a aplicação:**
    *   Abra o navegador e digite: `http://localhost/coffeehouse-saep/`
