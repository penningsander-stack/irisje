// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  // stop hier als er geen token is
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // elementen
  const reqBody = document.querySelector("#requests-table tbody");
  const revBody = document.querySelector("#reviews-table tbody");
  const nameEl = document.querySelector("[data-company-name]");
  const emailEl = document.querySelector("[data-company-email]");
  const lastLoginEl = document.getElementById("last-login");

  // bedrijf uit localStorage
  let company = {};
  try {
    company = JSON.parse(localStorage.getItem("company")) || {};
  } catch {
    company = {};
  }

  if (nameEl) nameEl.textContent = company.name || "Demo Bedrijf";
  if (emailEl) emailEl.textContent = company.email || "demo@irisje.nl";
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

  // uitloggen
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // aanvragen laden
  fetch(`${API_BASE}/api/requests/company`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.text())
    .then((txt) => {
      let data = [];
      try {
        data = JSON.parse(txt);
      } catch (e) {
        console.error("Fout bij parsen aanvragen:", e, txt);
      }
      if (!data.length) {
        reqBody.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
        return;
      }
      reqBody.innerHTML = data
        .map(
          (r) => `
          <tr>
            <td>${r.name}</td>
            <td>${r.email}</td>
            <td>${r.message}</td>
            <td>${r.status}</td>
            <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
            <td><button class="status-btn">Bekijk</button></td>
          </tr>`
        )
        .join("");
    })
    .catch((err) => {
      console.error("Fout bij aanvragen:", err);
      reqBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
    });

  // reviews laden
  fetch(`${API_BASE}/api/reviews/company`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => r.text())
    .then((txt) => {
      let data = [];
      try {
        data = JSON.parse(txt);
      } catch (e) {
        console.error("Fout bij parsen reviews:", e, txt);
      }
      if (!data.length) {
        revBody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
        return;
      }
      revBody.innerHTML = data
        .map(
          (r) => `
          <tr>
            <td>${r.name}</td>
            <td>${"⭐".repeat(r.rating || 0)}</td>
            <td>${r.message}</td>
            <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
            <td><button class="status-btn">Melden</button></td>
          </tr>`
        )
        .join("");
    })
    .catch((err) => {
      console.error("Fout bij reviews:", err);
      revBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden reviews.</td></tr>`;
    });
});
