// frontend/js/dashboard.js
// v2026-01-17 — ADMIN-FIRST dashboard (frontend-only)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/login.html";
    return;
  }

  try {
    const me = await apiGet("/auth/me");

    if (!me || me.ok === false || !me.user) {
      safeLogoutToLogin();
      return;
    }

    // 🔹 ADMIN-FIRST: admin ziet altijd alle bedrijven
    if (me.user.role === "admin") {
      const all = await apiGet("/companies");
      if (!all || all.ok === false || !Array.isArray(all.companies)) {
        showFatal("Kon bedrijven niet laden (admin).");
        return;
      }
      renderDashboard(all.companies, { admin: true });
      return;
    }

    // 🔹 NIET-admin: eigen bedrijven
    const my = await apiGet("/companies/my");

    if (!my || my.ok === false) {
      // ingelogd, maar geen toegang of geen bedrijf → registratie
      location.href = "/register-company.html";
      return;
    }

    if (!Array.isArray(my.companies) || my.companies.length === 0) {
      location.href = "/register-company.html";
      return;
    }

    renderDashboard(my.companies, { admin: false });
  } catch (err) {
    console.error("Dashboard init fout:", err);
    showFatal("Dashboard kon niet starten.");
  }
}

async function apiGet(path) {
  const token = localStorage.getItem("token");
  const r = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: "Bearer " + token },
  });

  if (r.status === 401) {
    safeLogoutToLogin();
    return null;
  }

  try {
    return await r.json();
  } catch {
    return null;
  }
}

function safeLogoutToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("companyId");
  location.href = "/login.html";
}

function showFatal(msg) {
  console.error(msg);
  alert(msg);
}

// 👉 Gebruik je bestaande render-logica.
// Deze stub laat zien dat we niets forceren.
function renderDashboard(companies, opts = {}) {
  console.log("Dashboard bedrijven:", companies, "admin:", opts.admin);
  // Plaats hier je bestaande DOM-rendercode (ongewijzigd).
}
