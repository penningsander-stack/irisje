// frontend/js/dashboard_safe.js
(function () {
  const API_BASE = '/api'; // Als je backend een andere host heeft, zet hier de volledige URL neer.
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  const els = {
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

  // Helpers
  function fmtDate(x) {
    try {
      const d = typeof x === 'string' || typeof x === 'number' ? new Date(x) : (x || new Date());
      return d.toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
    } catch { return '—'; }
  }
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // Auth / Me
  async function fetchMe() {
    try {
      const r = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (r.status === 401) return redirectLogin();
      if (!r.ok) throw 0;
      return await r.json();
    } catch { return { name: 'Bedrijf', lastLogin: null }; }
  }
  function applyMe(me) {
    els.companyName.textContent = me?.name || 'Bedrijf';
    els.lastLogin.textContent = me?.lastLogin ? fmtDate(me.lastLogin) : '—';
  }
  function redirectLogin() { window.location.href = './login.html'; return null; }

  // Requests
  async function fetchRequests() {
    try {
      const r = await fetch(`${API_BASE}/requests`, { credentials: 'include' });
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

  // Reviews
  async function fetchReviews() {
    const endpoints = [
      `${API_BASE}/reviews/company/me`,
      `${API_BASE}/reviews/my`,
      `${API_BASE}/reviews`,
    ];
    for (const url of endpoints) {
      try {
        const r = await fetch(url, { credentials: 'include' });
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

  // Events
  function setupEvents() {
    els.filterStatus?.addEventListener('change', () => {
      state.filter = els.filterStatus.value;
      renderRequests();
    });
    els.logoutBtn?.addEventListener('click', async () => {
      try { await fetch(`${API_BASE}/auth/logout`, { method:'POST', credentials:'include' }); } catch {}
      try { localStorage.removeItem('token'); sessionStorage.clear(); } catch {}
      window.location.href = './login.html';
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', async () => {
    setupEvents();
    const me = await fetchMe(); if (me) applyMe(me);
    state.requests = await fetchRequests();
    renderStats(computeStats(state.requests));
    renderRequests();
    state.reviews = await fetchReviews();
    renderReviews();
  });
})();
