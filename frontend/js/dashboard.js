// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const companyNameEl = document.querySelector("[data-company-name]");
  const companyEmailEl = document.querySelector("[data-company-email]");
  const companyCategoryEl = document.querySelector("[data-company-category]");
  const logoutBtn = document.getElementById("logout");

  // 🔐 Haal opgeslagen login op
  const token = localStorage.getItem("token");
  const company = JSON.parse(localStorage.getItem("company") || "{}");

  if (!token || !company.email) {
    window.location.href = "login.html";
    return;
  }

  // Toon bedrijfsgegevens
  companyNameEl.textContent = company.name || "Demo Bedrijf";
  companyEmailEl.textContent = company.email || "";
  companyCategoryEl.textContent = company.category || "";
  document.getElementById("last-login").textContent = new Date().toLocaleString();

  // 🔘 Uitloggen
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    window.location.href = "login.html";
  });

  // 📬 Aanvragen laden
  const tableBody = document.querySelector("#requests-table tbody");
  try {
    const res = await fetch(`${API_BASE}/api/requests/${company._id}`);
    if (!res.ok) throw new Error("Serverfout bij aanvragen");
    const data = await res.json();
    tableBody.innerHTML = "";

    if (!data.length) {
      tableBody.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
    } else {
      data.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.message}</td>
          <td>${r.status}</td>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td><button class="status-btn">Wijzig</button></td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Fout bij laden aanvragen:", err);
    tableBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
  }

  // 💬 Reviews laden
  const reviewBody = document.querySelector("#reviews-table tbody");
  try {
    const res = await fetch(`${API_BASE}/api/reviews/${company._id}`);
    if (!res.ok) throw new Error("Serverfout bij reviews");
    const data = await res.json();
    reviewBody.innerHTML = "";

    if (!data.length) {
      reviewBody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    } else {
      data.forEach((rev) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${rev.name}</td>
          <td>${rev.rating} ⭐</td>
          <td>${rev.message}</td>
          <td>${new Date(rev.date).toLocaleDateString()}</td>
          <td><button class="status-btn">Meld review</button></td>
        `;
        reviewBody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Fout bij laden reviews:", err);
    reviewBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden reviews.</td></tr>`;
  }
});
