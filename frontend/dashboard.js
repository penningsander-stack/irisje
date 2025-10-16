const API_BASE = 'https://irisje-backend.onrender.com/api';
const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'index.html';
}

const userEmailSpan = document.getElementById('userEmail');
const bedrijfStatus = document.getElementById('bedrijfStatus');
const noResults = document.getElementById('noResults');
const tableBody = document.querySelector('#aanvragenTable tbody');

// Uitloggen
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', () => {
  laadBedrijfInfo();
  laadStatistieken();
  laadAanvragen();
});

// 📌 Bedrijfsinfo
async function laadBedrijfInfo() {
  try {
    const res = await fetch(`${API_BASE}/secure/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    userEmailSpan.textContent = data.email || 'Onbekend';
    bedrijfStatus.textContent = data.companyName
      ? `Gekoppeld aan: ${data.companyName}`
      : '⚠️ Geen gekoppeld bedrijf';
  } catch {
    bedrijfStatus.textContent = '⚠️ Fout bij laden bedrijfsinfo';
  }
}

// 📈 Statistieken + grafieken
async function laadStatistieken() {
  try {
    const res = await fetch(`${API_BASE}/requests/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const stats = await res.json();

    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-accepted').textContent = stats.accepted || 0;
    document.getElementById('stat-rejected').textContent = stats.rejected || 0;
    document.getElementById('stat-followed').textContent = stats.followedUp || 0;

    tekenTaartGrafiek(stats);
    tekenTrendGrafiek();
  } catch (err) {
    console.error('Fout bij laden statistieken:', err);
  }
}

// 🎨 Taartdiagram
function tekenTaartGrafiek(stats) {
  const ctx = document.getElementById('statusChart');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Geaccepteerd', 'Afgewezen', 'Opgevolgd', 'Overig'],
      datasets: [{
        data: [
          stats.accepted || 0,
          stats.rejected || 0,
          stats.followedUp || 0,
          stats.total - ((stats.accepted || 0) + (stats.rejected || 0) + (stats.followedUp || 0))
        ],
        backgroundColor: ['#4CAF50', '#f44336', '#ff9800', '#9e9e9e']
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// 📉 Trendgrafiek (aanvragen per dag)
async function tekenTrendGrafiek() {
  try {
    const res = await fetch(`${API_BASE}/requests?days=30`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const aanvragen = data.items || [];

    // groepeer per datum
    const perDag = {};
    aanvragen.forEach(a => {
      const d = new Date(a.createdAt).toISOString().slice(0, 10);
      perDag[d] = (perDag[d] || 0) + 1;
    });

    const labels = Object.keys(perDag).sort();
    const waarden = labels.map(l => perDag[l]);

    const ctx = document.getElementById('trendChart');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Aanvragen per dag',
          data: waarden,
          backgroundColor: '#2196f3'
        }]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Datum' } },
          y: { title: { display: true, text: 'Aantal aanvragen' }, beginAtZero: true }
        },
        plugins: { legend: { display: false } }
      }
    });
  } catch (err) {
    console.error('Fout bij trendgrafiek:', err);
  }
}

// 📬 Aanvragen
async function laadAanvragen() {
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const aanvragen = data.items || [];

    tableBody.innerHTML = '';
    if (aanvragen.length === 0) {
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    aanvragen.forEach((a) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${a.customerName}</td>
        <td>${a.customerEmail}</td>
        <td>${a.message || ''}</td>
        <td>${(a.statusByCompany && a.statusByCompany[0]?.status) || 'Nieuw'}</td>
        <td>
          <select onchange="updateStatus('${a._id}', this.value)">
            <option value="">Wijzig</option>
            <option value="Geaccepteerd">Geaccepteerd</option>
            <option value="Afgewezen">Afgewezen</option>
            <option value="Opgevolgd">Opgevolgd</option>
          </select>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Fout bij laden aanvragen:', err);
  }
}

// 🔄 Status wijzigen
async function updateStatus(id, status) {
  try {
    await fetch(`${API_BASE}/requests/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    laadStatistieken();
    laadAanvragen();
  } catch (err) {
    console.error('Fout bij updaten status:', err);
  }
}
