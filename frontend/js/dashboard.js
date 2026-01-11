// frontend/js/dashboard.js
// v2026-01-17 — USER-ONLY dashboard (frontend-only)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // ⛔ dashboard.js mag NOOIT draaien op admin.html
  if (location.pathname.endsWith("/admin.html")) {
    return;
  }

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

    // ⛔ admin hoort hier niet
    if (me.user.role === "admin") {
      location.href = "/admin.html";
      return;
    }

    // 🔹 gewone gebruiker: eigen bedrijven
    const my = await apiGet("/companies/my");
    if (!my || my.ok === false || !Array.isArray(my.companies) || my.companies.length === 0) {
      location.href = "/register-company.html";
      return;
    }

    renderDashboard(my.companies);
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

// 👉 jouw bestaande rendercode blijft ongewijzigd
function renderDashboard(companies) {
  console.log("Dashboard bedrijven:", companies);
}
