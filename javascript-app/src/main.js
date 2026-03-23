import { keycloak } from './keycloak.js';

const API_BASE = '';

function showPage(page) {
  document.getElementById('public-page').classList.toggle('hidden', page !== 'public');
  document.getElementById('secured-page').classList.toggle('hidden', page !== 'secured');
  document.querySelectorAll('nav button').forEach((btn) => {
    btn.classList.toggle('primary', btn.dataset.page === page);
  });
}

function updateAuthUI() {
  const loggedIn = keycloak.authenticated;
  document.getElementById('username').textContent = loggedIn
    ? (keycloak.tokenParsed?.preferred_username ?? 'User')
    : '';
  document.getElementById('btn-login').classList.toggle('hidden', loggedIn);
  document.getElementById('btn-logout').classList.toggle('hidden', !loggedIn);

  const securedPage = document.getElementById('secured-page');
  const loginPrompt = document.getElementById('secured-login-prompt');
  const securedContent = document.getElementById('secured-content');
  if (loggedIn) {
    loginPrompt.classList.add('hidden');
    securedContent.classList.remove('hidden');
  } else {
    loginPrompt.classList.remove('hidden');
    securedContent.classList.add('hidden');
  }
}

function getAuthHeader() {
  if (keycloak.token) {
    keycloak.updateToken(30).catch(() => keycloak.login());
    return { Authorization: `Bearer ${keycloak.token}` };
  }
  return {};
}

async function fetchPublic(path, outputId) {
  const el = document.getElementById(outputId);
  try {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    el.classList.remove('error');
  } catch (e) {
    el.textContent = e.message;
    el.classList.add('error');
  }
}

async function fetchSecured(path, outputId) {
  if (!keycloak.authenticated) {
    keycloak.login();
    return;
  }
  const el = document.getElementById(outputId);
  try {
    const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeader() });
    if (res.status === 401) {
      keycloak.login();
      return;
    }
    const data = await res.json();
    el.textContent = JSON.stringify(data, null, 2);
    el.classList.remove('error');
  } catch (e) {
    el.textContent = e.message;
    el.classList.add('error');
  }
}

function bindEvents() {
  document.querySelectorAll('nav button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });
  document.getElementById('btn-login').addEventListener('click', () => keycloak.login());
  document.getElementById('btn-logout').addEventListener('click', () => keycloak.logout());
  document.getElementById('btn-secured-login').addEventListener('click', () => keycloak.login());

  document.getElementById('btn-health').addEventListener('click', () =>
    fetchPublic('/api/public/health', 'public-output')
  );
  document.getElementById('btn-info').addEventListener('click', () =>
    fetchPublic('/api/public/info', 'public-output')
  );
  document.getElementById('btn-me').addEventListener('click', () =>
    fetchSecured('/api/secured/me', 'secured-output')
  );
  document.getElementById('btn-data').addEventListener('click', () =>
    fetchSecured('/api/secured/data', 'secured-output')
  );
  document.getElementById('btn-token').addEventListener('click', () =>
    fetchSecured('/api/secured/token', 'secured-output')
  );
}

keycloak
  .init({ onLoad: 'check-sso', checkLoginIframe: false })
  .then(() => {
    updateAuthUI();
    showPage('public');
    bindEvents();
  })
  .catch((err) => {
    console.error('Keycloak init failed', err);
    updateAuthUI();
    showPage('public');
    bindEvents();
  });

keycloak.onAuthLogout = () => updateAuthUI();
keycloak.onAuthSuccess = () => updateAuthUI();
