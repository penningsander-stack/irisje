// frontend/dashboard.js
console.log('✅ dashboard.js geladen');

const API = 'https://irisje-backend.onrender.com/api';
document.addEventListener('DOMContentLoaded', init);

async function init() {
  const token = localStorage.getItem('token');
  const userInfoDiv = document.getElementById('userInfo');
  const tbody = document.getElementById('requestsTableBody');
  const statusFilter = document.getElementById('statusFilter');

  const totalEl = document.getElementById('statTotal');
  const acceptedEl = document.getElementById('statAccepted');
  const rejectedEl = document.getElementById('statRejected');
  const followedEl = document.getElementById('statFollowed');

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });

  if (!token) {
    userInfoDiv.innerHTML = '<p>⚠️ Geen token gevonden — log eerst in.</p>';
    return;
  }

  try {
    // Profiel
    const me = await apiGet('/secure/me', token);
    const bedrijf = me?.company?.name || 'Onbekend';
    const email = me?.email || 'Onbekend';
    const categorie = me?.company?.category || 'Onbekend';
    userInfoDiv.innerHTML = `<h3>${bedrijf}</h3><p><b>E-mail:</b> ${email}</p><p><b>Categorie:</b> ${categorie}</p>`;

    // Statistieken
    const stats = await apiGet('/requests/stats/overview', token);
    totalEl.textContent = stats.total ?? 0;
    acceptedEl.textContent = stats.accepted ?? 0;
    rejectedEl.textContent = stats.rejected ?? 0;
    followedEl.textContent = stats.followedUp ?? 0;

    // Aanvragen
    let requests = await apiGet('/requests', token);
    renderRequests(requests);

    // Filter
    statusFilter.addEventListener('change', () => {
      const val = statusFilter.value;
      const filtered = val === 'Alle' ? requests : requests.filter(r => r.status === val);
      renderRequests(filtered);
    });

    // Wijzig status
    async function updateStatus(id, status) {
      await fetch(`${API}/requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      requests = await apiGet('/requests', token);
      renderRequests(requests);
    }

    function renderRequests(list) {
      if (!Array.isArray(list) || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
        return;
      }
      tbody.innerHTML = list.map(r => `
        <tr>
          <td>${r.customerName || ''}</td>
          <td>${r.customerEmail || ''}</td>
          <td>${r.message || r.customerMessage || ''}</td>
          <td>${r.status || 'Nieuw'}</td>
          <td>
            <select onchange="updateStatus('${r._id}', this.value)">
              <option value="Nieuw" ${r.status==='Nieuw'?'selected':''}>Nieuw</option>
              <option value="Geaccepteerd" ${r.status==='Geaccepteerd'?'selected':''}>Geaccepteerd</option>
              <option value="Afgewezen" ${r.status==='Afgewezen'?'selected':''}>Afgewezen</option>
              <option value="Opgevolgd" ${r.status==='Opgevolgd'?'selected':''}>Opgevolgd</option>
            </select>
          </td>
        </tr>
      `).join('');
    }

    window.updateStatus = updateStatus; // 👈 beschikbaar in HTML
  } catch (err) {
    console.error('❌ Dashboard fout:', err);
    userInfoDiv.innerHTML = `<p>⚠️ Fout bij laden: ${err.message || err}</p>`;
  }
}

async function apiGet(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || res.status);
  return res.json();
}
