// frontend/js/admin.js
// v20251209-ADMIN-FIX
//
// Verbeteringen:
// 1. GEEN automatische logout meer bij 401 of ontbrekende adminToken.
// 2. Als een normale login-token 'token' aanwezig is én role=admin,
//    wordt automatisch 'adminToken' gezet.
// 3. Admin-sectie switching blijft intact.
//
// Dit bestand vervangt volledig de vorige admin.js.

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
  // Voorbeeld: bedrijven laden
  // ===============================
  async function loadCompanies() {
    const out = document.getElementById('adminCompanyTable');
    if (!out) return;

    out.innerHTML = '<tr><td colspan="5" class="admin-loading">Laden...</td></tr>';

    const res = await safeFetch('/api/admin/companies', { method: 'GET' });
    if (!res.ok) {
      out.innerHTML = '<tr><td colspan="5" class="admin-loading">Fout bij laden</td></tr>';
      return;
    }

    const list = res.data || [];
    if (!Array.isArray(list) || list.length === 0) {
      out.innerHTML = '<tr><td colspan="5" class="admin-loading">Geen bedrijven gevonden</td></tr>';
      return;
    }

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
  console.log('[admin.js] Admin-module geladen (v20251209-FIX)');
  switchSection('section-overview');

})();
