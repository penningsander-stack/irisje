// frontend/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userInfoDiv = document.getElementById('userInfo');
  const requestsTable = document.getElementById('requestsTableBody');

  const totalEl = document.getElementById('statTotal');
  const acceptedEl = document.getElementById('statAccepted');
  const rejectedEl = document.getElementById('statRejected');
  const followedEl = document.getElementById('statFollowed');

  const logoutBtn = document.getElementById('logoutBtn');

  // ✅ Uitloggen
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
    // --- 1️⃣ Bedrijfsinfo ophalen ---
    console.log('🔹 Ophalen bedrijfsinfo...');
    const meRes = await fetch('https://irisje-backend.onrender.com/api/secure/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log('🪶 /api/secure/me response:', meData);

    if (!meRes.ok) throw new Error(meData.message || 'Kon bedrijfsinfo niet laden');

    const bedrijf = meData.company ? meData.company.name : 'Onbekend';
    const email = meData.email || 'Onbekend';
    const categorie = meData.company ? meData.company.category : 'Onbekend';

    userInfoDiv.innerHTML = `
      <h3>${bedrijf}</h3>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Categorie:</strong> ${categorie}</p>
    `;

    // --- 2️⃣ Aanvragen ophalen ---
    console.log('🔹 Ophalen aanvragen...');
    const reqRes = await fetch('https://irisje-backend.onrender.com/api/requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await reqRes.json();
    console.log('🪶 /api/requests response:', requests);

    if (!reqRes.ok || !Array.isArray(requests)) {
      throw new Error('Fout bij ophalen aanvragen');
    }

    // --- 3️⃣ Statistieken berekenen ---
    const total = requests.length;
    const accepted = requests.filter((r) => r.status === 'Geaccepteerd').length;
    const rejected = requests.filter((r) => r.status === 'Afgewezen').length;
    const followed = requests.filter((r) => r.status === 'Opgevolgd').length;

    if (totalEl) totalEl.textContent = total;
    if (acceptedEl) acceptedEl.textContent = accepted;
    if (rejectedEl) rejectedEl.textContent = rejected;
    if (followedEl) followedEl.textContent = followed;

    // --- 4️⃣ Aanvragen tonen in tabel ---
    if (total === 0) {
      requestsTable.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    } else {
      requestsTable.innerHTML = requests
        .map(
          (r) => `
          <tr>
            <td>${r.customerName || '-'}</td>
            <td>${r.customerEmail || '-'}</td>
            <td>${r.customerMessage || '-'}</td>
            <td>${r.status || 'Nieuw'}</td>
            <td>${new Date(r.createdAt).toLocaleDateString('nl-NL')}</td>
          </tr>`
        )
        .join('');
    }
  } catch (err) {
    console.error('❌ Dashboard fout:', err);
    userInfoDiv.innerHTML = `<p>⚠️ Fout bij laden bedrijfsinfo: ${err.message}</p>`;
  }
});
