const state = {
  user: null,
  page: 1,
  totalPages: 1,
  activeFilter: '',
  showingForm: false,
};

const els = {
  companyLogo: document.getElementById('company-logo'),
  companyName: document.getElementById('company-name'),
  totalActivities: document.getElementById('total-activities'),
  totalCo2: document.getElementById('total-co2'),
  authBtn: document.getElementById('auth-btn'),
  filters: document.getElementById('filters'),
  activitiesList: document.getElementById('activities-list'),
  pagination: document.getElementById('pagination'),
  loginModal: document.getElementById('login-modal'),
  closeModal: document.getElementById('close-modal'),
  cancelLogin: document.getElementById('cancel-login'),
  submitLogin: document.getElementById('submit-login'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  activityTab: document.getElementById('activity-tab'),
  activityFormSection: document.getElementById('activity-form-section'),
  createActivity: document.getElementById('create-activity'),
  activityType: document.getElementById('activity-type'),
  activityDistance: document.getElementById('activity-distance'),
  activityDuration: document.getElementById('activity-duration'),
  errorType: document.getElementById('error-type'),
  errorDistance: document.getElementById('error-distance'),
  errorDuration: document.getElementById('error-duration'),
};

function showLoginModal() {
  els.loginModal.classList.remove('hidden');
}
function hideLoginModal() {
  els.loginModal.classList.add('hidden');
}

function requireAuth() {
  if (state.user) return true;
  showLoginModal();
  return false;
}

function formatDate(dateIso) {
  const d = new Date(dateIso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${hh}:${mm} - ${dd}/${MM}/${yy}`;
}

function toKm(meters) {
  return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 2)} km`;
}

function toHours(minutes) {
  const h = minutes / 60;
  return h >= 1 ? `${h.toFixed(1)} h` : `${minutes} min`;
}

function clearLoginValidation() {
  els.loginEmail.classList.remove('invalid');
  els.loginPassword.classList.remove('invalid');
  els.loginError.textContent = '';
}

async function loadCompany() {
  const query = state.user ? `?userId=${state.user.id}` : '';
  const res = await fetch(`http://localhost:3000/api/company${query}`);
  const data = await res.json();
  els.companyLogo.src = state.user?.photoUrl || data.company.logoUrl;
  els.companyName.textContent = state.user?.name || data.company.name;
  els.totalActivities.textContent = data.stats.totalActivities;
  els.totalCo2.textContent = data.stats.totalCo2Kg;
}

async function loadActivities() {
  const params = new URLSearchParams({ page: state.page });
  if (state.activeFilter) params.set('type', state.activeFilter);
  if (state.user) params.set('currentUserId', state.user.id);

  const res = await fetch(`http://localhost:3000/api/activities?${params}`);
  const data = await res.json();

  state.totalPages = data.totalPages;
  renderActivities(data.data);
  renderPagination();
}

function renderActivities(activities) {
  els.activitiesList.innerHTML = '';
  const tpl = document.getElementById('activity-card-template');

  activities.forEach((activity) => {
    const card = tpl.content.firstElementChild.cloneNode(true);
    card.querySelector('.activity-title').textContent = activity.title;
    card.querySelector('.activity-date').textContent = formatDate(activity.createdAt);
    card.querySelector('.activity-avatar').src = activity.user.photoUrl;
    card.querySelector('.activity-user').textContent = activity.user.name;
    card.querySelector('.distance').textContent = toKm(activity.distanceMeters);
    card.querySelector('.duration').textContent = toHours(activity.durationMinutes);
    card.querySelector('.co2').textContent = `${activity.co2Kg} kg`;

    const likeBtn = card.querySelector('.like-btn');
    const commentBtn = card.querySelector('.comment-btn');
    const likesCount = card.querySelector('.likes-count');
    const commentsCount = card.querySelector('.comments-count');

    likesCount.textContent = activity.likesCount;
    commentsCount.textContent = activity.commentsCount;

    if (activity.likedByCurrentUser) {
      likeBtn.classList.add('liked');
      likeBtn.textContent = '♥';
    }

    likeBtn.addEventListener('click', async () => {
      if (!requireAuth()) return;
      const response = await fetch(`http://localhost:3000/api/activities/${activity.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id }),
      });

      if (!response.ok) return;
      const payload = await response.json();
      likesCount.textContent = payload.likesCount;
      likeBtn.classList.toggle('liked', payload.liked);
      likeBtn.textContent = payload.liked ? '♥' : '♡';
    });

    const commentBox = card.querySelector('.comment-box');
    const commentInput = card.querySelector('.comment-input');
    const sendComment = card.querySelector('.send-comment');
    const commentError = card.querySelector('.error');

    commentBtn.addEventListener('click', () => {
      if (!requireAuth()) return;
      commentBox.classList.toggle('hidden');
    });

    sendComment.addEventListener('click', async () => {
      if (!requireAuth()) return;
      commentInput.classList.remove('invalid');
      commentError.textContent = '';

      const content = commentInput.value.trim();
      if (content.length < 2) {
        commentInput.classList.add('invalid');
        commentError.textContent = 'Comentário deve ter no mínimo 2 caracteres.';
        return;
      }

      const response = await fetch(`http://localhost:3000/api/activities/${activity.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.user.id, content }),
      });

      if (!response.ok) return;
      const payload = await response.json();
      commentsCount.textContent = payload.commentsCount;
      commentInput.value = '';
      commentBox.classList.add('hidden');
    });

    els.activitiesList.appendChild(card);
  });
}

function renderPagination() {
  els.pagination.innerHTML = '';

  const prev = document.createElement('button');
  prev.textContent = 'Anterior';
  prev.disabled = state.page === 1;
  prev.addEventListener('click', () => {
    if (!requireAuth()) return;
    state.page -= 1;
    loadActivities();
  });
  els.pagination.appendChild(prev);

  for (let p = 1; p <= state.totalPages; p += 1) {
    const btn = document.createElement('button');
    btn.textContent = p;
    if (p === state.page) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (!requireAuth()) return;
      state.page = p;
      loadActivities();
    });
    els.pagination.appendChild(btn);
  }

  const next = document.createElement('button');
  next.textContent = 'Próximo';
  next.disabled = state.page === state.totalPages;
  next.addEventListener('click', () => {
    if (!requireAuth()) return;
    state.page += 1;
    loadActivities();
  });
  els.pagination.appendChild(next);

  if (!state.user) {
    [...els.pagination.querySelectorAll('button')].forEach((b) => (b.disabled = true));
  }
}

function resetFormErrors() {
  [els.activityType, els.activityDistance, els.activityDuration].forEach((el) => el.classList.remove('invalid'));
  [els.errorType, els.errorDistance, els.errorDuration].forEach((el) => (el.textContent = ''));
}

async function handleCreateActivity() {
  if (!requireAuth()) return;
  resetFormErrors();

  const type = els.activityType.value;
  const distance = els.activityDistance.value;
  const duration = els.activityDuration.value;

  let invalid = false;

  if (!type) {
    els.activityType.classList.add('invalid');
    els.errorType.textContent = 'Campo obrigatório';
    invalid = true;
  }
  if (!distance) {
    els.activityDistance.classList.add('invalid');
    els.errorDistance.textContent = 'Campo obrigatório';
    invalid = true;
  }
  if (!duration) {
    els.activityDuration.classList.add('invalid');
    els.errorDuration.textContent = 'Campo obrigatório';
    invalid = true;
  }

  if (invalid) return;

  const response = await fetch('http://localhost:3000/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: state.user.id,
      type,
      distanceMeters: Number(distance),
      durationMinutes: Number(duration),
    }),
  });

  if (!response.ok) return;

  els.activityType.value = '';
  els.activityDistance.value = '';
  els.activityDuration.value = '';
  state.page = 1;
  await Promise.all([loadCompany(), loadActivities()]);
}

async function handleLogin() {
  clearLoginValidation();
  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value.trim();

  if (!email || !password) {
    els.loginEmail.classList.add('invalid');
    els.loginPassword.classList.add('invalid');
    els.loginError.textContent = 'email ou senha obrigatório';
    return;
  }

  const response = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    els.loginEmail.classList.add('invalid');
    els.loginPassword.classList.add('invalid');
    els.loginError.textContent = 'email ou senha incorreta';
    return;
  }

  const data = await response.json();
  state.user = data.user;
  state.page = 1;

  els.authBtn.textContent = 'Logout';
  els.activityTab.disabled = false;
  hideLoginModal();

  [...els.filters.querySelectorAll('button')].forEach((btn) => (btn.disabled = false));

  await Promise.all([loadCompany(), loadActivities()]);
}

function handleLogout() {
  state.user = null;
  state.page = 1;
  state.activeFilter = '';
  state.showingForm = false;

  els.authBtn.textContent = 'Login';
  els.activityTab.disabled = true;
  els.activityTab.classList.remove('active');
  els.activityFormSection.classList.add('hidden');

  [...els.filters.querySelectorAll('button')].forEach((btn) => {
    btn.classList.remove('active');
    btn.disabled = true;
  });

  loadCompany();
  loadActivities();
}

function bindEvents() {
  els.authBtn.addEventListener('click', () => {
    if (state.user) {
      handleLogout();
    } else {
      showLoginModal();
    }
  });

  els.closeModal.addEventListener('click', hideLoginModal);
  els.cancelLogin.addEventListener('click', hideLoginModal);
  els.submitLogin.addEventListener('click', handleLogin);

  els.filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-type]');
    if (!button) return;
    if (!requireAuth()) return;

    state.activeFilter = button.dataset.type;
    state.page = 1;

    [...els.filters.querySelectorAll('button')].forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    loadActivities();
  });

  els.activityTab.addEventListener('click', () => {
    if (!requireAuth()) return;
    state.showingForm = !state.showingForm;
    els.activityTab.classList.toggle('active', state.showingForm);
    els.activityFormSection.classList.toggle('hidden', !state.showingForm);
  });

  els.createActivity.addEventListener('click', handleCreateActivity);
}

async function init() {
  bindEvents();
  [...els.filters.querySelectorAll('button')].forEach((btn) => (btn.disabled = true));
  await Promise.all([loadCompany(), loadActivities()]);
}

init();
