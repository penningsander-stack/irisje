// frontend/dashboard.js
console.log('✅ NIEUWE dashboard.js geladen');

const API = 'https://irisje-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const token = localStorage.getItem('token');
  const userInfoDiv = document.getElementById('userInfo');
  const tbody = document.getElementById('requestsTableBody');
  const totalEl = document.getElementById('statTotal');
  const acceptedEl = document.getElementById('statAccepted');
  const rejectedEl = document.getElementById('statRejected');
  const followedEl = document.getElementById('statFollowed');
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });
  }

  if (!token) {
    userInfoDiv.innerHTML = '<p>⚠️ Geen token gevonden — log eerst in.</p>';
    return;
  }

  try {
    // 1️⃣ Profiel ophalen
    const me = await apiGet('/secure/me', token);
    console.log('🪶 /secure/me →', me);

    const bedrijf = me?.company?.name || 'Onbekend';
    const email = me?.email || 'Onbekend';
    const categorie = me?.company?.category || 'Onbekend';

    userInfoDiv.innerHTML = `
      <h2>${bedrijf}</h2>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Categorie:</strong> ${categorie}</p>
    `;

    // 2️⃣ Statistieken
    const stats = await apiGet('/requests/stats/overview', token);
    console.log('🪶 /requests/stats/overview →', stats);
    if (totalEl) totalEl.textContent = stats.total ?? 0;
    if (acceptedEl) acceptedEl.textContent = stats.accepted ?? 0;
    if (rejectedEl) rejectedEl.textContent = stats.rejected ?? 0;
    if (followedEl) followedEl.textContent = stats.followedUp ?? 0;

    // 3️⃣ Aanvragen ophalen
    const items = await apiGet('/requests', token);
    console.log('🪶 /requests →', items);

    if (!Array.isArray(items) || items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(r => {
      const msg = r.message || r.customerMessage || '';
      const status = r.status || 'Nieuw';
      const created = r.createdAt ? new Date(r.createdAt).toLocaleDateString('nl-NL') : '';
      return `
        <tr>
          <td>${escapeHtml(r.customerName || '')}</td>
          <td>${escapeHtml(r.customerEmail || '')}</td>
          <td>${escapeHtml(msg)}</td>
          <td>${escapeHtml(status)}</td>
          <td>${escapeHtml(created)}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('❌ Dashboard fout:', err);
    userInfoDiv.innerHTML = `<p>⚠️ Fout bij laden: ${err.message || err}</p>`;
  }
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const t = await safeJson(res);
    throw new Error(t?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]));
}
