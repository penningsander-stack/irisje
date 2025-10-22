// frontend/js/dashboard_safe.js
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // —————————————————————————————————————————————
  // 1) API autodetect: vindt zelf de juiste backend
  //    Probeert in volgorde en gebruikt de 1e die 200 op /auth/ping geeft
  //    (Valt terug op /auth/me als /auth/ping niet bestaat)
  // —————————————————————————————————————————————
  const sameOrigin = `${location.origin}/api`;
  const candidates = [
    // 1) same origin (reverse proxy)
    sameOrigin,
    // 2) hoofd-domein (als je frontend subdomein is)
    'https://irisje.nl/api',
    // 3) mogelijke backend Render hostnamen
    'https://irisje-backend.onrender.com/api',
    'https://irisje.onrender.com/api',
    'https://irisje-api.onrender.com/api',
    // 4) fallback: hard same-origin nogmaals
    '/api'
  ];

 // frontend/js/dashboard_safe.js
const API_BASE = "https://irisje-backend.onrender.com/api";


  async function probe(base) {
    try {
      // Probeer eerst een lichte ping (als die bestaat)
      const ping = await fetch(`${base}/auth/ping`, { credentials:'include' });
      if (ping.ok) return true;
      // Zo niet, probeer /auth/me (kan 200 of 401 geven; 401 betekent wel dat de route bestaat)
      const me = await fetch(`${base}/auth/me`, { credentials:'include' });
      if (me.ok || me.status === 401) return true;
    } catch {}
    return false;
  }

  async function detectApiBase() {
    for (const base of candidates) {
      const ok = await probe(base);
      if (ok) { API_BASE = base; return base; }
    }
    return null;
  }

  // —————————————————————————————————————————————
  // 2) Elementen
  // —————————————————————————————————————————————
  const els = {
    debug: $('#debugBanner'),
    companyName: $('#companyName'),
    lastLogin: $('#lastLogin'),
    statTotal: $('#statTotal'),
    statAccepted: $('#statAccepted'),
    statRejected: $('#statRejected'),
    statFollowedUp: $('#statFollowedUp'),
    requestsBody: $('#requestsBody'),
    reviewsBody: $('#reviewsBody'),
    filterStatus: $('#filterStatus'),
    logoutBtn: $('#logoutBtn'),
  };

  const state = {
    requests: [],
    reviews: [],
    filter: 'all',
  };

  // —————————————————————————————————————————————
  // 3) Helpers
  // —————————————————————————————————————————————
  function showDebug(msg) {
    if (!els.debug) return;
    els.debug.style.display = 'block';
    els.debug.innerHTML = msg;
  }

  function fmtDate(x) {
    try {
      const d = typeof x === 'string' || typeof x === 'number' ? new Date(x) : (x || new Date());
      return d.toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return '—'; }
  }
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function redirectLogin() { window.location.href = './login.html'; return null; }

  // —————————————————————————————————————————————
  // 4) API calls (met autodetected API_BASE)
  // —————————————————————————————————————————————
  async function apiGet(path) {
    if (!API_BASE) throw new Error('API_BASE missing');
    const res = await fetch(`${API_BASE}${path}`, { credentials:'include' });
    return res;
  }

  async function fetchMe() {
    try {
      const r = await apiGet('/auth/me');
      if (r.status === 401) return redirectLogin();
      if (!r.ok) throw 0;
      return await r.json();
    } catch { return { name: 'Bedrijf', lastLogin: null }; }
  }

  function applyMe(me) {
    els.companyName.textContent = me?.name || 'Bedrijf';
    els.lastLogin.textContent = me?.lastLogin ? fmtDate(me.lastLogin) : '—';
  }

  async function fetchRequests() {
    try {
      const r = await apiGet('/requests');
      if (r.status === 401) return redirectLogin() || [];
      if (!r.ok) throw 0;
      const data = await r.json();
      return Array.isArray(data) ? data : (data.items || []);
    } catch { return []; }
  }

  function computeStats(list) {
    const total = list.length;
    let accepted = 0, rejected = 0, followedUp = 0;
    for (const it of list) {
      const st = String(it.status || '').toLowerCase();
      if (st === 'geaccepteerd' || st === 'accepted') accepted++;
      else if (st === 'afgewezen' || st === 'rejected') rejected++;
      else if (st === 'opgevolgd' || st === 'followedup' || st === 'opgepakt') followedUp++;
    }
    return { total, accepted, rejected, followedUp };
  }

  function renderStats(stats) {
    els.statTotal.textContent = stats.total;
    els.statAccepted.textContent = stats.accepted;
    els.statRejected.textContent = stats.rejected;
    els.statFollowedUp.textContent = stats.followedUp;
  }

  function renderRequests() {
    const tbody = els.requestsBody;
    tbody.innerHTML = '';
    let list = state.requests;
    if (state.filter !== 'all') {
      list = list.filter(it => {
        const st = String(it.status || '').toLowerCase();
        if (state.filter === 'accepted') return st === 'accepted' || st === 'geaccepteerd';
        if (state.filter === 'rejected') return st === 'rejected' || st === 'afgewezen';
        if (state.filter === 'followedUp') return st === 'followedup' || st === 'opgevolgd' || st === 'opgepakt';
        return true;
      });
    }
    if (!list.length) {
      const tr = document.createElement('tr');
      tr.className = 'iris-empty-row';
      tr.innerHTML = `<td colspan="5">Geen aanvragen gevonden.</td>`;
      tbody.appendChild(tr);
      return;
    }
    for (const r of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(r.name || r.senderName || '—')}</td>
        <td>${esc(r.email || r.senderEmail || '—')}</td>
        <td>${esc(r.message || r.msg || '—')}</td>
        <td>${esc(r.status || '—')}</td>
        <td>${esc(fmtDate(r.createdAt || r.date || new Date()))}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  async function fetchReviews() {
    const endpoints = [
      '/reviews/company/me',
      '/reviews/my',
      '/reviews',
    ];
    for (const path of endpoints) {
      try {
        const r = await apiGet(path);
        if (r.status === 401) return redirectLogin() || [];
        if (!r.ok) continue;
        const data = await r.json();
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
      } catch { /* volgende proberen */ }
    }
    return [];
  }

  function renderReviews() {
    const tbody = els.reviewsBody;
    tbody.innerHTML = '';
    if (!state.reviews.length) {
      const tr = document.createElement('tr');
      tr.className = 'iris-empty-row';
      tr.innerHTML = `<td colspan="5">Geen reviews gevonden.</td>`;
      tbody.appendChild(tr);
      return;
    }
    for (const rv of state.reviews) {
      const id = rv._id || rv.id || '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${esc(rv.authorName || rv.name || '—')}</td>
        <td>${'⭐'.repeat(Number(rv.rating || 0)) || '—'}</td>
        <td>${esc(rv.message || rv.text || '—')}</td>
        <td>${esc(fmtDate(rv.createdAt || rv.date || new Date()))}</td>
        <td><button class="iris-btn iris-btn-sm iris-btn-outline" data-action="report" data-id="${esc(id)}">Meld</button></td>
      `;
      tbody.appendChild(tr);
    }

    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action="report"]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      btn.disabled = true; btn.textContent = 'Melden…';
      try {
        const r = await fetch(`${API_BASE}/reviews/report/${encodeURIComponent(id)}`, {
          method: 'POST', credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ reason: 'gemeld_via_dashboard' }),
        });
        if (!r.ok) throw 0;
        btn.textContent = 'Gemeld'; btn.classList.add('is-muted');
      } catch {
        btn.disabled = false; btn.textContent = 'Meld';
        alert('Melden van review is mislukt.');
      }
    }, { once:true });
  }

  // —————————————————————————————————————————————
  // 5) Events
  // —————————————————————————————————————————————
  function setupEvents() {
    els.filterStatus?.addEventListener('change', () => {
      state.filter = els.filterStatus.value;
      renderRequests();
    });
    els.logoutBtn?.addEventListener('click', async () => {
      try {
        await fetch(`${API_BASE}/auth/logout`, { method:'POST', credentials:'include' });
      } catch {}
      try { localStorage.removeItem('token'); sessionStorage.clear(); } catch {}
      window.location.href = './login.html';
    });
  }

  // —————————————————————————————————————————————
  // 6) Init flow
  // —————————————————————————————————————————————
  document.addEventListener('DOMContentLoaded', async () => {
    setupEvents();

    // Detecteer werkende API base
    const base = await detectApiBase();
    if (!base) {
      showDebug(`<strong>API onbereikbaar.</strong> Kon geen werkende /api vinden op: ${candidates.map(esc).join(', ')}`);
      // Laat de rest van de UI staan; user kan iig uitloggen/terug
      return;
    }

    // Toon in debug (alleen tijdelijk zichtbaar als er écht iets misgaat)
    // showDebug(`API: ${esc(base)}`); // desgewenst uitcommentariëren

    // Laad data
    const me = await fetchMe(); if (me) applyMe(me);

    state.requests = await fetchRequests();
    renderStats(computeStats(state.requests));
    renderRequests();

    state.reviews = await fetchReviews();
    renderReviews();
  });
})();
