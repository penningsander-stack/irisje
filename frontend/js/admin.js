// frontend/js/admin.js
// v20251210-ADMIN-FIX-COMPANIES
//
// Verbeteringen t.o.v. vorige versie (v20251209-ADMIN-FIX):
// 1. Bedrijvenoverzicht gebruikt nu res.data.companies i.p.v. res.data.
// 2. 'Totaal bedrijven' teller wordt bijgewerkt (element met id 'adminCompanyTotal').
// 3. Bij init wordt automatisch een eerste loadCompanies() gedaan.
// 4. Extra logging zodat duidelijk is hoeveel bedrijven geladen zijn.
//
// Dit bestand vervangt volledig de vorige admin.js (frontend).

(function () {
  'use strict';

  const API_BASE = window.irisjeApiBaseUrl || 'https://irisje-backend.onrender.com';

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
    } catch {}
  }

  // ===============================
  // AUTO-CONVERT token -> adminToken
  // ===============================
  (async function autoConvertTokenIfAdmin() {
    const token = getToken('token');           // normaal dashboard token
    const adminToken = getToken('adminToken'); // admin token

    if (adminToken) return;
    if (!token) return;

    try {
      const res = await fetch(API_BASE + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.role === 'admin') {
        setToken('adminToken', token);
        console.log('[admin.js] Normale token is admin → adminToken automatisch ingesteld.');
      }
    } catch (err) {
      console.warn('[admin.js] Fout bij auto-convert token:', err);
    }
  })();

  // ===============================
  // Admin logout knop
  // ===============================
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      console.log('[admin.js] Admin-token verwijderd. Pagina vernieuwen.');
      location.reload();
    });
  }

  // ===============================
  // NAVIGATIE
  // ===============================
  const nav = document.getElementById('adminNav');
  if (nav) {
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-section]');
      if (!btn) return;

      const target = btn.getAttribute('data-section');
      switchSection(target);

      [...nav.querySelectorAll('.nav-item')].forEach(b => {
        b.classList.remove('bg-indigo-50', 'text-indigo-700');
      });
      btn.classList.add('bg-indigo-50', 'text-indigo-700');
    });
  }

  function switchSection(sectionId) {
    document.querySelectorAll('section[id^="section-"]').forEach(sec => {
      sec.classList.add('hidden');
    });
    const active = document.getElementById(sectionId);
    if (active) active.classList.remove('hidden');
  }

  // ===============================
  // VEILIGE FETCH (GEEN LOGOUT)
  // ===============================
  async function safeFetch(path, options = {}) {
    const adminToken = getToken('adminToken');

    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    headers.set('Content-Type', 'application/json');

    if (adminToken) {
      headers.set('Authorization', 'Bearer ' + adminToken);
    }

    const cfg = Object.assign({}, options, { headers });
    let res;
    try {
      res = await fetch(API_BASE + path, cfg);
    } catch (err) {
      console.error('[admin.js] Fetch fout:', err);
      return { ok: false, error: 'fetch-error' };
    }

    if (!res.ok) {
      console.warn('[admin.js] Endpoint gaf foutstatus:', res.status, path);
      return { ok: false, status: res.status, text: await res.text() };
    }

    return { ok: true, data: await res.json() };
  }

  // ===============================
  // Bedrijven laden
  // ===============================
  async function loadCompanies() {
    const out = document.getElementById('adminCompanyTable');
    const totalEl = document.getElementById('adminCompanyTotal');

    if (!out) {
      console.warn('[admin.js] adminCompanyTable element niet gevonden.');
      return;
    }

    out.innerHTML = '<tr><td colspan="5" class="admin-loading">Laden...</td></tr>';
    if (totalEl) totalEl.textContent = '–';

    const res = await safeFetch('/api/admin/companies', { method: 'GET' });
    if (!res.ok) {
      console.error('[admin.js] Fout bij /api/admin/companies:', res);
      out.innerHTML = '<tr><td colspan="5" class="admin-loading">Fout bij laden</td></tr>';
      return;
    }

    const payload = res.data || {};
    const list = Array.isArray(payload.companies) ? payload.companies : [];

    if (totalEl) totalEl.textContent = String(list.length);

    if (list.length === 0) {
      out.innerHTML = '<tr><td colspan="5" class="admin-loading">Geen bedrijven gevonden</td></tr>';
      console.log('[admin.js] loadCompanies: geen bedrijven gevonden.');
      return;
    }

    console.log('[admin.js] loadCompanies: ' + list.length + ' bedrijven ontvangen.');

    out.innerHTML = list.map(c => `
      <tr>
        <td class="p-3">${c.name || '-'}</td>
        <td class="p-3">${c.email || '-'}</td>
        <td class="p-3">${c.status || '-'}</td>
        <td class="p-3 text-center">${(c.reviewCount ?? 0)}</td>
        <td class="p-3">-</td>
      </tr>
    `).join('');
  }

  const btn = document.getElementById('refreshCompanies');
  if (btn) {
    btn.addEventListener('click', loadCompanies);
  }

  // ===============================
  // INIT
  // ===============================
  console.log('[admin.js] Admin-module geladen (v20251210-ADMIN-FIX-COMPANIES)');
  switchSection('section-overview');
  // Automatisch eerste bedrijven-load bij start
  loadCompanies();

})();
