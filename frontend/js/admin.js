// frontend/js/admin.js
// v20251210-ADMIN-FULL-FIX
//
// Volledige adminmodule voor Irisje.nl
// - Bedrijvenoverzicht
// - Gemelde reviews (incl. "Melding wissen")
// - Claimverzoeken
// - Serverlogs
// - Navigatie tussen secties
// - Admin-tokengebruik zonder automatische logout

(function () {
  'use strict';

  const API_BASE = window.irisjeApiBaseUrl || 'https://irisje-backend.onrender.com';

  // ------------------------------
  // Helpers
  // ------------------------------
  function getToken(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setToken(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTime(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleString('nl-NL');
    } catch {
      return '-';
    }
  }

  async function safeFetch(path, options = {}) {
    const adminToken = getToken('adminToken');
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (adminToken) {
      headers.set('Authorization', 'Bearer ' + adminToken);
    }

    const config = Object.assign({}, options, { headers });

    let res;
    try {
      res = await fetch(API_BASE + path, config);
    } catch (err) {
      console.error('[admin.js] fetch-fout bij', path, err);
      return { ok: false, status: 0, error: 'fetch', data: null };
    }

    if (!res.ok) {
      let text = '';
      try {
        text = await res.text();
      } catch {
        // ignore
      }
      console.warn('[admin.js] HTTP-fout', res.status, 'bij', path, text);
      return { ok: false, status: res.status, error: 'http', data: text };
    }

    try {
      const data = await res.json();
      return { ok: true, status: res.status, data };
    } catch (err) {
      console.error('[admin.js] JSON-fout bij', path, err);
      return { ok: false, status: res.status, error: 'json', data: null };
    }
  }

  // Probeer bestaand 'token' te hergebruiken als adminToken
  (async function bootstrapAdminToken() {
    const existingAdmin = getToken('adminToken');
    if (existingAdmin) {
      return;
    }
    const normalToken = getToken('token');
    if (!normalToken) return;

    try {
      const res = await fetch(API_BASE + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + normalToken }
      });

      if (!res.ok) return;
      const data = await res.json();
      if (data && (data.role === 'admin' || data.role === 'superadmin')) {
        setToken('adminToken', normalToken);
        console.log('[admin.js] adminToken gezet op basis van normale login-token.');
      }
    } catch (err) {
      console.warn('[admin.js] kon /api/auth/me niet ophalen', err);
    }
  })();

  // ------------------------------
  // NAVIGATIE
  // ------------------------------
  const nav = document.getElementById('adminNav');

  function switchSection(sectionId) {
    const sectionIds = [
      'section-overview',
      'section-reported',
      'section-claims',
      'section-logs'
    ];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === sectionId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    if (nav) {
      const links = nav.querySelectorAll('[data-section]');
      links.forEach((link) => {
        const target = link.getAttribute('data-section');
        if (target === sectionId) {
          link.classList.add('bg-indigo-50', 'text-indigo-700');
        } else {
          link.classList.remove('bg-indigo-50', 'text-indigo-700');
        }
      });
    }
  }

  if (nav) {
    nav.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-section]');
      if (!btn) return;
      const target = btn.getAttribute('data-section');
      if (!target) return;
      switchSection(target);
      if (target === 'section-overview') {
        loadCompanies();
      } else if (target === 'section-reported') {
        loadReportedReviews();
      } else if (target === 'section-claims') {
        loadClaims();
      } else if (target === 'section-logs') {
        loadServerLogs();
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      try {
        localStorage.removeItem('adminToken');
      } catch {
        // ignore
      }
      console.log('[admin.js] Admin-token verwijderd. Pagina wordt herladen.');
      location.reload();
    });
  }

  // ------------------------------
  // BEDRIJVEN
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

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-loading">Geen bedrijven gevonden</td></tr>';
      if (totalEl) totalEl.textContent = '0';
      return;
    }

    if (totalEl) totalEl.textContent = String(list.length);

    tbody.innerHTML = list.map((company) => {
      const name = company.name || company.bedrijfsnaam || '-';
      const email = company.email || '-';
      const status =
        company.status ||
        (company.verified === true || company.isVerified === true
          ? 'Geverifieerd'
          : 'Onbevestigd');
      const reviewCount =
        typeof company.reviewCount === 'number'
          ? company.reviewCount
          : Array.isArray(company.reviews)
          ? company.reviews.length
          : company.reviewCount || 0;

      return `
        <tr>
          <td class="p-3">${escapeHtml(name)}</td>
          <td class="p-3">${escapeHtml(email)}</td>
          <td class="p-3">${escapeHtml(status)}</td>
          <td class="p-3 text-center">${escapeHtml(String(reviewCount))}</td>
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
  // GEMELDE REVIEWS
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
      tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Fout bij laden van gemelde reviews</td></tr>';
      return;
    }

    const payload = res.data || {};
    let list = [];

    if (Array.isArray(payload.reviews)) {
      list = payload.reviews;
    } else if (Array.isArray(payload)) {
      list = payload;
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-loading">Geen gemelde reviews gevonden</td></tr>';
      return;
    }

    let openCount = 0;
    let resolvedCount = 0;

    tbody.innerHTML = list.map((rev) => {
      const companyName =
        rev.companyName ||
        (rev.company && (rev.company.name || rev.company.bedrijfsnaam)) ||
        '-';
      const name = rev.name || rev.reviewerName || '-';
      const rating = rev.rating != null ? rev.rating : '-';
      const message = rev.message || rev.text || '-';
      const reason = rev.reportReason || rev.reason || 'Gemeld';
      const dateStr =
        rev.date ? formatDateTime(rev.date) : rev.createdAt ? formatDateTime(rev.createdAt) : '-';

      const status = rev.status || (rev.reported === true ? 'Open' : 'Afgehandeld');
      if (status === 'Open') openCount += 1;
      else resolvedCount += 1;

      const id = rev._id || rev.id || '';

      const actionCell = id
        ? `<button type="button"
              class="px-2 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-700 text-white"
              data-review-id="${escapeHtml(id)}">
              Melding wissen
            </button>`
        : '<span class="text-xs text-slate-400">–</span>';

      return `
        <tr>
          <td class="p-3">${escapeHtml(companyName)}</td>
          <td class="p-3">${escapeHtml(name)}</td>
          <td class="p-3 text-center">${escapeHtml(String(rating))}</td>
          <td class="p-3">${escapeHtml(message)}</td>
          <td class="p-3">${escapeHtml(reason)}</td>
          <td class="p-3 whitespace-nowrap">${escapeHtml(dateStr)}</td>
          <td class="p-3">${escapeHtml(status)}</td>
          <td class="p-3">${actionCell}</td>
        </tr>
      `;
    }).join('');

    if (totalEl) totalEl.textContent = String(list.length);
    if (openEl) openEl.textContent = String(openCount);
    if (resolvedEl) resolvedEl.textContent = String(resolvedCount);

    // Klik-handlers voor "Melding wissen"
    tbody.onclick = async (event) => {
      const btn = event.target.closest('button[data-review-id]');
      if (!btn) return;
      const id = btn.getAttribute('data-review-id');
      if (!id) return;

      const confirmed = window.confirm('Weet je zeker dat je de melding van deze review wilt wissen?');
      if (!confirmed) return;

      const res = await safeFetch('/api/admin/reported-reviews/' + encodeURIComponent(id) + '/clear', {
        method: 'POST'
      });

      if (!res.ok) {
        window.alert('Kon de melding niet wissen. Bekijk de console voor details.');
        return;
      }

      console.log('[admin.js] Melding gewist voor review', id);
      loadReportedReviews();
    };
  }

  const refreshReportedBtn = document.getElementById('refreshBtn');
  if (refreshReportedBtn) {
    refreshReportedBtn.addEventListener('click', () => {
      loadReportedReviews();
    });
  }

  // ------------------------------
  // CLAIMVERZOEKEN
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
      return;
    }

    tbody.innerHTML = list.map((claim) => {
      const companyName =
        claim.companyName ||
        (claim.companyId && (claim.companyId.name || claim.companyId.bedrijfsnaam)) ||
        (claim.company && (claim.company.name || claim.company.bedrijfsnaam)) ||
        '-';

      const contactName = claim.contactName || claim.name || '-';
      const email = claim.email || '-';
      const phone = claim.phone || '-';
      const status = claim.status || 'Open';
      const dateStr =
        claim.createdAt ? formatDateTime(claim.createdAt) : claim.date ? formatDateTime(claim.date) : '-';

      return `
        <tr>
          <td class="p-3 whitespace-nowrap">${escapeHtml(dateStr)}</td>
          <td class="p-3">${escapeHtml(companyName)}</td>
          <td class="p-3">${escapeHtml(contactName)}</td>
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
  // SERVERLOGS
  // ------------------------------
  async function loadServerLogs() {
    const container = document.getElementById('logs-container');
    if (!container) {
      console.warn('[admin.js] logs-container niet gevonden.');
      return;
    }

    container.textContent = 'Logs worden geladen...';

    const res = await safeFetch('/api/admin/logs', { method: 'GET' });
    if (!res.ok) {
      container.textContent = 'Kon de serverlogs niet ophalen.';
      return;
    }

    const payload = res.data || {};
    let lines = [];

    if (Array.isArray(payload.logs)) {
      lines = payload.logs;
    } else if (Array.isArray(payload)) {
      lines = payload;
    } else if (typeof payload === 'string') {
      lines = payload.split('\n');
    }

    if (!lines.length) {
      container.textContent = 'Geen logregels beschikbaar.';
      return;
    }

    container.innerHTML = lines
      .map((line) => `<div class="font-mono whitespace-pre text-[11px]">${escapeHtml(line)}</div>`)
      .join('');
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
  switchSection('section-overview');
  loadCompanies();
  loadReportedReviews();
  loadClaims();
  loadServerLogs();

})();
