// frontend/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userInfoDiv = document.getElementById('userInfo');
  const requestsTable = document.getElementById('requestsTableBody');

  if (!token) {
    userInfoDiv.innerHTML = '<p>⚠️ Geen token gevonden — log eerst in.</p>';
    return;
  }

  try {
    console.log('🔹 Ophalen bedrijfsinfo met token:', token.substring(0, 20) + '...');

    const res = await fetch('https://irisje-backend.onrender.com/api/secure/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    console.log('🔹 /api/secure/me response:', data);

    if (!res.ok) {
      throw new Error(data.message || 'Fout bij ophalen bedrijfsinfo');
    }

    if (!data.company) {
      userInfoDiv.innerHTML = `<p>⚠️ Geen gekoppeld bedrijf gevonden voor ${data.email}</p>`;
      return;
    }

    // ✅ Toon bedrijfsinformatie
    userInfoDiv.innerHTML = `
      <h3>${data.company.name}</h3>
      <p><strong>E-mail:</strong> ${data.email}</p>
      <p><strong>Categorie:</strong> ${data.company.category}</p>
    `;

    // ✅ Ophalen aanvragen van dit bedrijf
    const reqRes = await fetch('https://irisje-backend.onrender.com/api/requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await reqRes.json();
    console.log('🔹 /api/requests:', requests);

    if (!reqRes.ok || !Array.isArray(requests) || requests.length === 0) {
      requestsTable.innerHTML = `<tr><td colspan="4">Geen aanvragen gevonden.</td></tr>`;
      return;
    }

    requestsTable.innerHTML = requests
      .map(
        (r) => `
      <tr>
        <td>${r.customerName}</td>
        <td>${r.customerEmail}</td>
        <td>${r.status || 'Onbekend'}</td>
        <td>${new Date(r.createdAt).toLocaleDateString('nl-NL')}</td>
      </tr>`
      )
      .join('');
  } catch (err) {
    console.error('❌ Dashboard fout:', err.message);
    userInfoDiv.innerHTML = `<p>⚠️ Fout bij laden bedrijfsinfo: ${err.message}</p>`;
  }
});
