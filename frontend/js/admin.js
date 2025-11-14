// frontend/js/admin.js

const API_BASE = "https://irisje-backend.onrender.com/api";

// JUISTE ENDPOINTS
const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_COMPANIES = `${API_BASE}/admin/overview`;   // FIXED
const ENDPOINT_GET_CLAIMS = `${API_BASE}/admin/claims`;        // FIXED

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251114-FINAL-FIX)");

  const logoutBtn = byId("logoutBtn");
  const refreshReviewsBtn = byId("refreshBtn");
  const refreshLogsBtn = byId("refreshLogsBtn");
  const logsContainer = byId("logs-container");
  const adminTable = byId("adminCompanyTable");
  const refreshCompaniesBtn = byId("refreshCompanies");
  const claimTableBody = byId("claimTableBody");
  const refreshClaimsBtn = byId("refreshClaims");

  /* ============================================================
     NOTIFICATIEBALK
  ============================================================ */
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  notif.textContent = "✅ Handeling voltooid";
  document.body.appendChild(notif);

  function showNotif(message = "✅ Handeling voltooid", success = true) {
    notif.textContent = message;
    notif.classList.remove("hidden");
    notif.classList.toggle("bg-green-600", success);
    notif.classList.toggle("bg-red-600", !success);
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s";
    setTimeout(() => (notif.style.opacity = "1"), 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  /* ============================================================
     LOGOUT
  ============================================================ */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }

  /* ============================================================
     BEDRIJVEN LADEN (ADMIN OVERVIEW)
  ============================================================ */
  async function loadAdminCompanies() {
    if (!adminTable) return;
    adminTable.innerHTML =
      '<tr><td colspan="5" class="text-center p-4 text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_COMPANIES);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data.companies))
        throw new Error("Ongeldig antwoord van /admin/overview");

      const companies = data.companies;

      if (!companies.length) {
        adminTable.innerHTML =
          '<tr><td colspan="5" class="text-center p-4 text-gray-400">Geen bedrijven gevonden.</td></tr>';
        return;
      }

      adminTable.innerHTML = companies
        .map((c) => {
          const statusBadge = c.isVerified
            ? '<span class="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Geverifieerd</span>'
            : '<span class="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">Niet geverifieerd</span>';

          return `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 font-medium">${esc(c.name)}</td>
          <td class="p-3">${esc(c.ownerEmail || "-")}</td>
          <td class="p-3">${statusBadge}</td>
          <td class="p-3 text-center">${c.reviewCount || 0}</td>
          <td class="p-3 flex gap-2">
            <button class="verifyBtn text-green-600 text-sm" data-id="${c._id}">✔️ Verifiëren</button>
            <button class="deleteBtn text-red-600 text-sm" data-id="${c._id}">🗑️ Verwijderen</button>
          </td>
        </tr>`;
        })
        .join("");

      document.querySelectorAll(".deleteBtn").forEach((btn) =>
        btn.addEventListener("click", () => doDeleteCompany(btn.dataset.id))
      );

      document.querySelectorAll(".verifyBtn").forEach((btn) =>
        btn.addEventListener("click", () => doVerifyCompany(btn.dataset.id))
      );
    } catch (err) {
      console.error("❌ fout bedrijven:", err);
      adminTable.innerHTML =
        '<tr><td colspan="5" class="text-center p-4 text-red-600">❌ Fout bij laden van bedrijven.</td></tr>';
    }
  }

  /* ============================================================
     CLAIMS LADEN
  ============================================================ */
  async function loadClaims() {
    if (!claimTableBody) return;

    claimTableBody.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data.items))
        throw new Error("Ongeldig antwoord van /admin/claims");

      const list = data.items;

      if (!list.length) {
        claimTableBody.innerHTML =
          '<tr><td colspan="6" class="p-4 text-center text-gray-400">Geen claimverzoeken.</td></tr>';
        return;
      }

      claimTableBody.innerHTML = list
        .map(
          (c) => `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3">${formatDate(c.createdAt)}</td>
          <td class="p-3">${esc(c.companyId?.name || "(onbekend)")}</td>
          <td class="p-3">${esc(c.contactName)}</td>
          <td class="p-3">${esc(c.contactEmail)}</td>
          <td class="p-3">${esc(c.contactPhone)}</td>
          <td class="p-3">${esc(c.status || "in behandeling")}</td>
        </tr>`
        )
        .join("");
    } catch (err) {
      console.error("❌ fout claims:", err);
      claimTableBody.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Fout bij laden van claims.</td></tr>';
    }
  }

  /* ============================================================
     LOGS LADEN
  ============================================================ */
  async function loadServerLogs() {
    if (!logsContainer) return;

    logsContainer.textContent = "Logs worden geladen...";

    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();

      if (!res.ok || !Array.isArray(logs)) throw new Error("Ongeldig antwoord");

      logsContainer.innerHTML = logs
        .slice(-50)
        .reverse()
        .map(
          (l) =>
            `<div class="mb-1 text-sm"><span class="text-gray-500">${formatDate(
              l.timestamp
            )}:</span> ${esc(l.message)}</div>`
        )
        .join("");
    } catch (err) {
      logsContainer.innerHTML =
        '<div class="text-red-600">❌ Kon serverlogs niet laden.</div>';
    }
  }

  /* ============================================================
     INIT LOADS
  ============================================================ */
  await loadAdminCompanies();
  await loadReportedReviews();
  await loadClaims();
  await loadServerLogs();

  setInterval(loadServerLogs, 30000);
}

/* ============================================================
   HELPERS
============================================================ */
function byId(id) {
  return document.getElementById(id);
}

function esc(v) {
  return v == null
    ? ""
    : String(v).replace(/[&<>"']/g, (s) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
          s
        ])
      );
}

function formatDate(v) {
  const d = new Date(v);
  if (!v || isNaN(d)) return "-";
  return d.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
