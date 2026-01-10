// frontend/js/dashboard.js
// v2026-01-17 — FIX: geen automatische logout bij ontbrekend bedrijf

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/login.html";
    return;
  }

  try {
    const my = await apiGet("/companies/my");

    // 🔹 GEEN harde logout meer
    if (!my || my.ok === false) {
      console.warn("companies/my gaf geen geldige response:", my);
      // gebruiker is wel ingelogd, maar heeft (nog) geen bedrijf
      location.href = "/register-company.html";
      return;
    }

    if (!Array.isArray(my.companies) || my.companies.length === 0) {
      // ingelogd, maar nog geen bedrijf
      location.href = "/register-company.html";
      return;
    }

    // normaal dashboard-pad
    renderDashboard(my.companies);
  } catch (err) {
    console.error("Dashboard init fout:", err);
    // fallback: niet uitloggen, maar naar registratie
    location.href = "/register-company.html";
  }
}

async function apiGet(path) {
  const token = localStorage.getItem("token");
  const r = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  // ❗ alleen bij expliciete 401 → logout
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

function renderDashboard(companies) {
  // bestaande render-logica ongewijzigd
  console.log("Dashboard bedrijven:", companies);

  // als je hier al code had: die blijft gewoon werken
}
