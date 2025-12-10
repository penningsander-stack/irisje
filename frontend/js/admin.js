// frontend/js/admin.js
// v20251210-ADMIN-FULL-FIX
//
// Verantwoordelijk voor:
// - Navigatie tussen admin-secties
// - Laden van bedrijvenoverzicht
// - Laden van claimverzoeken
// - Uitloggen voor admin
//
// Gebruikt:
// - localStorage.adminToken (of converteert automatisch vanuit 'token')
// - API_BASE: window.irisjeApiBaseUrl of standaard backend-URL
//
// LET OP: dit bestand hoort bij frontend/admin.html in Irisje.nl.

(function () {
  'use strict';

  const API_BASE = window.irisjeApiBaseUrl || 'https://irisje-backend.onrender.com';

  // ------------------------------
  // Helpers voor tokens
  // ------------------------------
  function getToken(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setToken(key, val) {
    try {
      localStorage.setItem(key, val);
    } catch {
      // negeren
    }
  }

  // ------------------------------
  // Probeer automatisch token -> adminToken te maken
  // ------------------------------
  (async function autoConvertTokenIfAdmin() {
    const token = getToken('token');
    const adminToken = getToken('adminToken');

    if (adminToken || !token) return;

    try {
      const res = await fetch(API_BASE + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data && data.role === 'admin') {
        setToken('adminToken', token);
        console.log('[admin.js] Normale token is admin → adminToken ingesteld.');
      }
    } catch (err) {
      console.warn('[admin.js] Fout bij auto-convert token:', err);
    }
  })();

  // ------------------------------
  // Veilige fetch met adminToken
  // ------------------------------
  async function safeFetch(path, options = {}) {
    const adminToken = getToken('adminToken');

    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    // Content-Type alleen zetten bij body
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json');
    }

    if (adminToken) {
      headers.set('Authorization', 'Bearer ' + adminToken);
    }

    const cfg = Object.assign({}, options, { headers });

    let res;
    try {
      res = await fetch(API_BASE + path, cfg);
    } catch (err) {
      console.error('[admin.js] Fetch-fout naar', path, err);
      return { ok: false, error: 'fetch-error', status: 0 };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn('[admin.js] Endpoint gaf foutstatus:', res.status, path);
      return { ok: false, status: res.status, text };
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      console.error('[admin.js] Kon JSON niet parsen van', path, err);
      return { ok: false, status: res.status, error: 'invalid-json' };
    }

    return { ok: true, data };
  }

  // ------------------------------
  // Navigatie tussen secties
  // ------------------------------
  const nav = document.getElementById('adminNav');

  function switchSection(sectionId) {
    document.querySelectorAll('section[id^="section-"]').forEach(sec => {
      sec.classList.add('hidden');
    });
    const active = document.getElementById(sectionId);
    if (active) {
      active.classList.remove('hidden');
    }
  }

  if (nav) {
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-section]');
      if (!btn) return;

      const target = btn.getAttribute('data-section');
      switchSection(target);

      // active state
      nav.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('bg-indigo-50', 'text-indigo-700');
      });
      btn.classList.add('bg-indigo-50', 'text-indigo-700');
    });
  }

  // ------------------------------
  // Admin uitloggen
  // ------------------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      console.log('[admin.js] Admin-token verwijderd, pagina wordt herladen.');
      location.reload();
    });
  }

  // ------------------------------
  // Bedrijvenoverzicht
  // ------------------------------
  async function loadCompanies() {
    const tbody = document.getElementById('adminCompanyTable');
    const totalEl = document.getElementById('total-companies');

    if (!tbody) {
      console.warn('[admin.js] adminCompanyTable niet gevonden.');
      return;
    }

    tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Laden...</td></tr>';
    if (totalEl) totalEl.textContent = '–';

    const res = await safeFetch('/api/admin/companies', { method: 'GET' });
    if (!res.ok) {
      console.error('[admin.js] Fout bij /api/admin/companies:', res);
      tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Fout bij laden van bedrijven</td></tr>';
      return;
    }

    const payload = res.data || {};
    let list = [];

    if (Array.isArray(payload.companies)) {
      list = payload.companies;
    } else if (Array.isArray(payload)) {
      list = payload;
    }

    if (totalEl) totalEl.textContent = String(list.length);

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Geen bedrijven gevonden</td></tr>';
      console.log('[admin.js] loadCompanies: geen bedrijven gevonden.');
      return;
    }

    console.log('[admin.js] loadCompanies: ' + list.length + ' bedrijven ontvangen.');

    tbody.innerHTML = list.map((c) => {
      const name = c.name || '-';
      const email = c.email || '-';
      const status = c.status || (c.isVerified ? 'Geverifieerd' : 'Onbevestigd');
      const reviewCount = (c.reviewCount != null) ? c.reviewCount : (c.reviewsCount != null ? c.reviewsCount : 0);

      return `
        <tr>
          <td class="p-3">${escapeHtml(name)}</td>
          <td class="p-3">${escapeHtml(email)}</td>
          <td class="p-3">${escapeHtml(status)}</td>
          <td class="p-3 text-center">${reviewCount}</td>
          <td class="p-3 text-xs text-slate-500">–</td>
        </tr>
      `;
    }).join('');
  }

  const refreshCompaniesBtn = document.getElementById('refreshCompanies');
  if (refreshCompaniesBtn) {
    refreshCompaniesBtn.addEventListener('click', () => {
      loadCompanies();
    });
  }

  // ------------------------------
  // Claimverzoeken
  // ------------------------------
  async function loadClaims() {
    const tbody = document.getElementById('claimTableBody');
    if (!tbody) {
      console.warn('[admin.js] claimTableBody niet gevonden.');
      return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="admin-loading">Laden...</td></tr>';

    const res = await safeFetch('/api/admin/claims', { method: 'GET' });
    if (!res.ok) {
      console.error('[admin.js] Fout bij /api/admin/claims:', res);
      tbody.innerHTML = '<tr><td colspan="6" class="admin-loading">Fout bij laden van claimverzoeken</td></tr>';
      return;
    }

    const payload = res.data || {};
    let list = [];

    if (Array.isArray(payload.claims)) {
      list = payload.claims;
    } else if (Array.isArray(payload)) {
      list = payload;
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-loading">Geen claimverzoeken gevonden</td></tr>';
      console.log('[admin.js] loadClaims: geen claims gevonden.');
      return;
    }

    console.log('[admin.js] loadClaims: ' + list.length + ' claims ontvangen.');

    tbody.innerHTML = list.map((cl) => {
      const createdAt = cl.createdAt || cl.created_at || null;
      const dateStr = createdAt ? formatDateTime(createdAt) : '-';

      const companyName = cl.companyName
        || (cl.company && (cl.company.name || cl.company.bedrijfsnaam))
        || '-';

      const contact = cl.contactName || cl.contact || cl.contactPerson || '-';
      const email = cl.email || cl.contactEmail || (cl.company && cl.company.email) || '-';
      const phone = cl.phone || cl.telephone || cl.tel || cl.contactPhone || '-';

      let status = cl.status || null;
      if (!status) {
        if (cl.resolved === true) status = 'Afgehandeld';
        else if (cl.resolved === false) status = 'Open';
        else status = 'In behandeling';
      }

      return `
        <tr>
          <td class="p-3 whitespace-nowrap">${escapeHtml(dateStr)}</td>
          <td class="p-3">${escapeHtml(companyName)}</td>
          <td class="p-3">${escapeHtml(contact)}</td>
          <td class="p-3">${escapeHtml(email)}</td>
          <td class="p-3">${escapeHtml(phone)}</td>
          <td class="p-3">${escapeHtml(status)}</td>
        </tr>
      `;
    }).join('');
  }

  const refreshClaimsBtn = document.getElementById('refreshClaims');
  if (refreshClaimsBtn) {
    refreshClaimsBtn.addEventListener('click', () => {
      loadClaims();
    });
  }

  // ------------------------------
  // Kleine helpers
  // ------------------------------
  function escapeHtml(value) {
    if (value == null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(input) {
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return String(input);
      return d.toLocaleDateString('nl-NL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) + ' ' + d.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(input);
    }
  }

  
  // ------------------------------
  // Gemelde reviews
  // ------------------------------
  async function loadReportedReviews() {
    const tbody = document.getElementById('reported-table-body');
    const totalEl = document.getElementById('total-reported');
    const openEl = document.getElementById('open-reported');
    const resolvedEl = document.getElementById('resolved-reported');

    if (!tbody) {
      console.warn('[admin.js] reported-table-body niet gevonden.');
      return;
    }

    tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Laden...</td></tr>';
    if (totalEl) totalEl.textContent = '0';
    if (openEl) openEl.textContent = '0';
    if (resolvedEl) resolvedEl.textContent = '0';

    const res = await safeFetch('/api/admin/reported-reviews', { method: 'GET' });
    if (!res.ok) {
      console.error('[admin.js] Fout bij /api/admin/reported-reviews:', res);
      tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Fout bij laden van gemelde reviews</td></tr>';
      return;
    }

    // Mogelijke responsetypen:
    // { ok: true, reviews: [...] }
    // { reviews: [...] }
    // [ ... ]
    const payload = res.data || {};
    let list = [];

    if (Array.isArray(payload.reviews)) {
      list = payload.reviews;
    } else if (Array.isArray(payload)) {
      list = payload;
    } else if (Array.isArray(payload.data?.reviews)) {
      list = payload.data.reviews;
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Geen gemelde reviews gevonden</td></tr>';
      console.log('[admin.js] loadReportedReviews: geen gemelde reviews gevonden.');
      return;
    }

    const total = list.length;
    let openCount = 0;
    let resolvedCount = 0;

    tbody.innerHTML = list.map((rev) => {
      const companyName = rev.companyName
        || (rev.company && (rev.company.name || rev.company.bedrijfsnaam))
        || '-';

      const name = rev.name || rev.reviewerName || '-';
      const email = rev.email || rev.reviewerEmail || '-';
      const rating = (rev.rating != null) ? rev.rating : '-';
      const message = rev.message || rev.text || '-';
      const reportedReason = rev.reportReason || rev.reason || 'Gemeld';
      const dateStr = rev.date ? formatDateTime(rev.date) : (rev.createdAt ? formatDateTime(rev.createdAt) : '-');

      const status = rev.status || (rev.reported === true ? 'Open' : 'Afgehandeld');
      if (status === 'Open') openCount += 1;
      else resolvedCount += 1;

      const id = rev._id || rev.id || '';

      const actionCell = id
        ? `<button type="button"
              class="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700 text-white"
              onclick="window.clearReportedReview && window.clearReportedReview('${id}')">
              Melding wissen
            </button>`
        : '<span class="text-xs text-slate-400">–</span>';

      return `
        <tr>
          <td class="p-3">${escapeHtml(companyName)}</td>
          <td class="p-3">${escapeHtml(name)}</td>
          <td class="p-3 text-center">${escapeHtml(String(rating))}</td>
          <td class="p-3">${escapeHtml(message)}</td>
          <td class="p-3">${escapeHtml(reportedReason)}</td>
          <td class="p-3 whitespace-nowrap">${escapeHtml(dateStr)}</td>
          <td class="p-3">${escapeHtml(status)}</td>
          <td class="p-3">${actionCell}</td>
        </tr>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = String(total);
    if (openEl) openEl.textContent = String(openCount);
    if (resolvedEl) resolvedEl.textContent = String(resolvedCount);
  }

  const refreshReportedBtn = document.getElementById('refreshBtn');
  if (refreshReportedBtn) {
    refreshReportedBtn.addEventListener('click', () => {
      loadReportedReviews();
    });
  }

  // Globale helper voor "Melding wissen"
  window.clearReportedReview = async function (reviewId) {
    if (!reviewId) return;

    const sure = window.confirm('Weet je zeker dat je de melding van deze review wilt wissen?');
    if (!sure) return;

    const res = await safeFetch('/api/admin/reported-reviews/' + encodeURIComponent(reviewId) + '/clear', {
      method: 'POST'
    });

    if (!res.ok) {
      console.error('[admin.js] Fout bij POST /api/admin/reported-reviews/:id/clear:', res);
      window.alert('Kon de melding niet wissen. Zie de console voor details.');
      return;
    }

    console.log('[admin.js] Melding gewist voor review', reviewId, res);
    loadReportedReviews();
  };

  // ------------------------------
  // Serverlogs
  // ------------------------------
  async function loadServerLogs() {
    const container = document.getElementById('logs-container');
    if (!container) {
      console.warn('[admin.js] logs-container niet gevonden.');
      return;
    }

    container.textContent = 'Logs worden geladen...';

    // We proberen een generiek status-/logs-endpoint
    const res = await safeFetch('/api/status/logs', { method: 'GET' });
    if (!res.ok) {
      console.error('[admin.js] Fout bij /api/status/logs:', res);
      container.textContent = 'Kon de serverlogs niet ophalen.';
      return;
    }

    const payload = res.data;

    let lines = [];
    if (Array.isArray(payload)) {
      lines = payload;
    } else if (Array.isArray(payload?.logs)) {
      lines = payload.logs;
    } else if (typeof payload === 'string') {
      lines = payload.split('\\n');
    }

    if (!lines.length) {
      container.textContent = 'Geen logregels beschikbaar.';
      return;
    }

    container.innerHTML = lines.map((line) => {
      return '<div class="font-mono whitespace-pre">' + escapeHtml(String(line)) + '</div>';
    }).join('');
  }

  const refreshLogsBtn = document.getElementById('refreshLogsBtn');
  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener('click', () => {
      loadServerLogs();
    });
  }

// ------------------------------
  // INIT
  // ------------------------------
  console.log('[admin.js] Admin-module geladen (v20251210-ADMIN-FULL-FIX)');

  // Standaard sectie: bedrijvenoverzicht
  switchSection('section-overview');

  // Eerste load van bedrijven en claims
  loadCompanies();
  loadClaims();

})();
