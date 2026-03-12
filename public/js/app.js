function setActiveNav() {
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.getAttribute('href').endsWith(current)) {
      link.classList.add('active');
    }
  });
}

function getStoredPhone() {
  return window.localStorage.getItem('notifyUserPhone') || '';
}

function setStoredPhone(phone) {
  const normalized = String(phone || '').replace(/[^\d]/g, '');
  if (normalized) {
    window.localStorage.setItem('notifyUserPhone', normalized);
  } else {
    window.localStorage.removeItem('notifyUserPhone');
  }
  return normalized;
}

function getAuthHeaders(extraHeaders = {}) {
  const phone = getStoredPhone();
  return {
    ...(phone ? { 'x-user-phone': phone } : {}),
    ...extraHeaders,
  };
}

function ensureSessionPanel() {
  if (document.getElementById('notifySessionPanel')) return;

  const target = document.querySelector('.main') || document.body;
  const wrapper = document.createElement('section');
  wrapper.id = 'notifySessionPanel';
  wrapper.className = 'card';
  wrapper.style.marginBottom = '24px';
  wrapper.innerHTML = `
    <h2 class="section-title">Dashboard Session</h2>
    <div class="content-grid">
      <label>
        Auth Phone
        <input id="notifySessionPhone" placeholder="Enter teacher or admin phone">
      </label>
      <div>
        <button id="notifySessionSave" type="button">Save Session</button>
        <button id="notifySessionClear" type="button" class="secondary" style="margin-left:8px;">Clear</button>
      </div>
    </div>
    <p class="muted" style="margin-top:12px;">Protected dashboard APIs use the saved phone number as the x-user-phone header.</p>
    <div id="notifySessionStatus" class="status"></div>
  `;

  target.prepend(wrapper);

  const input = document.getElementById('notifySessionPhone');
  const status = document.getElementById('notifySessionStatus');
  input.value = getStoredPhone();

  document.getElementById('notifySessionSave').addEventListener('click', () => {
    const normalized = setStoredPhone(input.value);
    status.className = 'status success';
    status.textContent = normalized
      ? `Session saved for ${normalized}`
      : 'Enter a valid phone number.';
  });

  document.getElementById('notifySessionClear').addEventListener('click', () => {
    setStoredPhone('');
    input.value = '';
    status.className = 'status';
    status.textContent = 'Session cleared.';
  });
}

function showStatus(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `status ${type}`;
  el.textContent = message;
}

async function fetchJson(url, options = {}) {
  const headers = getAuthHeaders(options.headers || {});
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const rawText = await response.text();
  const data = rawText ? JSON.parse(rawText) : {};

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

window.NotifyApp = {
  setActiveNav,
  showStatus,
  fetchJson,
  getAuthHeaders,
  getStoredPhone,
  setStoredPhone,
};

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  ensureSessionPanel();
});
