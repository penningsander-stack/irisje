// frontend/js/dashboard_safe.js
(function () {
  const API_BASE = '/api'; // werkt voor Render met dezelfde host; zo niet, vervang met volledige backend-URL
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

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
    filteredStatus: 'all',
  };

  // ——— Utils ———
  function fmtDate(d) {
    try {
      const dt = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
      return dt.toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '—';
    }
  }

  function sanitize(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ——— Auth / Me ———
  async function fetchMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (res.status === 401) {
        // niet ingelogd → naar login
        window.location.href = './login.html';
        return null;
      }
      if (!res.ok) throw new Error('auth/me failed');
      return await res.json();
    } catch {
      // als /auth/me niet bestaat, ga door met defaults
      return { name: 'Bedrijf', lastLogin: null };
    }
  }

  function applyMe(me) {
    if (!me) return;
    els.companyName.textContent = me.name || 'Bedrijf';
    const last = me.lastLogin || me.last_login || null;
    els.lastLogin.textContent = last ? fmtDate(last) : '—';
  }

  // ——— Requests ———
  async function fetchRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests`, { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = './login.html';
        return [];
      }
      if (!res.ok) throw new Error('requests failed');
      const data = await res.json();
      return Array.isArray(data) ? data : (data.items || []);
    } catch {
      return [];
    }
  }

  function computeStats(requests) {
    const total = requests.length;
    let accepted = 0, rejected = 0, followedUp = 0;
    for (const r of requests) {
      const st = (r.status || '').toLowerCase();
      if (st === 'accepted' || st === 'geaccepteerd') accepted++;
      else if (st === 'rejected' || st === 'afgewezen') rejected++;
      else if (st === 'followedup' || st === 'opgevolgd' || st === 'opgepakt') followedUp++;
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
    const list = state.filteredStatus === 'all'
      ? state.requests
      : state.requests.filter(r => {
          const st = (r.status || '').toLowerCase();
          if (state.filteredStatus === 'accepted') return st === 'accepted' || st === 'geaccepteerd';
          if (state.filteredStatus === 'rejected') return st === 'rejected' || st === 'afgewezen';
          if (state.filteredStatus === 'followedUp') return st === 'followedup' || st === 'opgevolgd' || st === 'opgepakt';
          return true;
        });

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
        <td>${sanitize(r.name || r.senderName || '—')}</td>
        <td>${sanitize(r.email || r.senderEmail || '—')}</td>
        <td>${sanitize(r.message || r.msg || '—')}</td>
        <td>${sanitize(r.status || '—')}</td>
        <td>${sanitize(fmtDate(r.createdAt || r.date || new Date()))}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // ——— Reviews ———
  async function fetchReviews() {
    // Probeer generieke endpoint; val desnoods terug op lege lijst (UI blijft werken)
    const candidates = [
      `${API_BASE}/reviews/company/me`,
      `${API_BASE}/reviews/my`,
      `${API_BASE}/reviews`,
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.status === 401) {
          window.location.href = './login.html';
          return [];
        }
        if (!res.ok) continue;
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.items)) return data.items;
      } catch {
        // probeer volgende
      }
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
        <td>${sanitize(rv.authorName || rv.name || '—')}</td>
        <td>${'⭐'.repeat(Number(rv.rating || 0)) || '—'}</td>
        <td>${sanitize(rv.message || rv.text || '—')}</td>
        <td>${sanitize(fmtDate(rv.createdAt || rv.date || new Date()))}</td>
        <td>
          <button class="iris-btn iris-btn-sm iris-btn-outline" data-action="report" data-id="${sanitize(id)}">Meld</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action="report"]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;

      btn.disabled = true;
      btn.textContent = 'Melden…';
      try {
        const res = await fetch(`${API_BASE}/reviews/report/${encodeURIComponent(id)}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'gemeld_via_dashboard' }),
        });
        if (!res.ok) throw new Error('report failed');
        btn.textContent = 'Gemeld';
        btn.classList.add('is-muted');
      } catch {
        btn.disabled = false;
        btn.textContent = 'Meld';
        alert('Melden van review is mislukt.');
      }
    }, { once: true });
  }

  // ——— Events ———
  function setupEvents() {
    if (els.filterStatus) {
      els.filterStatus.addEventListener('change', () => {
        state.filteredStatus = els.filterStatus.value;
        renderRequests();
      });
    }

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', async () => {
        try {
          await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
        } catch { /* negeren */ }
        try {
          localStorage.removeItem('token');
          sessionStorage.clear();
        } catch {/* noop */}
        window.location.href = './login.html';
      });
    }
  }

  // ——— Init ———
  document.addEventListener('DOMContentLoaded', async () => {
    setupEvents();

    const me = await fetchMe();
    applyMe(me);

    state.requests = await fetchRequests();
    renderStats(computeStats(state.requests));
    renderRequests();

    state.reviews = await fetchReviews();
    renderReviews();
  });
})();
