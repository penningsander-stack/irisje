// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API = window.ENV.API_BASE;
  const token = localStorage.getItem("token");
  const companyData = JSON.parse(localStorage.getItem("company"));

  if (!token || !companyData) {
    window.location.href = "login.html";
    return;
  }

  document.querySelector("[data-company-name]").textContent = companyData.name;
  document.querySelector("[data-company-email]").textContent = companyData.email;
  document.querySelector("#last-login").textContent = new Date().toLocaleString();

  const headers = { Authorization: `Bearer ${token}` };

  // Aanvragen ophalen
  const reqTable = document.querySelector("#requests-table tbody");
  try {
    const res = await fetch(`${API}/api/requests/company/${companyData._id}`, { headers });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      reqTable.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
    } else {
      reqTable.innerHTML = data.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.message}</td>
          <td>${r.status}</td>
          <td>${new Date(r.createdAt).toLocaleDateString()}</td>
          <td>-</td>
        </tr>
      `).join("");
    }

    // Statistieken
    const statusCount = data.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    renderChart(statusCount);
  } catch {
    reqTable.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
  }

  // Reviews ophalen
  const revTable = document.querySelector("#reviews-table tbody");
  try {
    const res = await fetch(`${API}/api/reviews/company/${companyData._id}`, { headers });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      revTable.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    } else {
      revTable.innerHTML = data.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${"⭐".repeat(r.rating)}</td>
          <td>${r.message}</td>
          <td>${new Date(r.createdAt).toLocaleDateString()}</td>
          <td>-</td>
        </tr>
      `).join("");
    }
  } catch {
    revTable.innerHTML = `<tr><td colspan="5">Serverfout bij laden reviews.</td></tr>`;
  }

  // Uitloggen
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });
});

function renderChart(data) {
  const ctx = document.getElementById("statusChart");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data),
        backgroundColor: ["#60a5fa", "#34d399", "#f87171", "#facc15"],
      }],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });
}
