// frontend/js/admin.js
// v20251114-STABLE-CLEAN

const API_BASE = "https://irisje-backend.onrender.com/api";

const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_COMPANIES = `${API_BASE}/admin/overview`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/admin/claims`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251114-STABLE)");

  const logoutBtn = byId("logoutBtn");
  const refreshCompaniesBtn = byId("refreshCompanies");
  const adminTable = byId("adminCompanyTable");

  const refreshReviewsBtn = byId("refreshBtn");
  const reportedTableBody = byId("reported-table-body");

  const refreshClaimsBtn = byId("refreshClaims");
  const claimTableBody = byId("claimTableBody");

  const refreshLogsBtn = byId("refreshLogsBtn");
  const logsContainer = byId("logs-container");

  /* ============================================================
     NOTIFICATIEBALK
  ============================================================ */
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  document.body.appendChild(notif);

  function showNotif(message = "✔ Handeling voltooid", success = true) {
    notif.textContent = message;
    notif.classList.remove("hidden");
    notif.classList.toggle("bg-green-600", success);
    notif.classList.toggle("bg-red-600", !success);

    notif.style.opacity = "1";
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 1800);
  }

  /* ============================================================
     LOGOUT — FIXED (nooit meer auto-login)
  ============================================================ */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/");
      });
      window.location.href = "login.html";
    });
  }

  /* ============================================================
     BEDRIJVEN LADEN
  ============================================================ */
  async function loadAdminCompanies(retry = 0) {
    adminTable.innerHTML =
      '<tr><td colspan="5" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_COMPANIES, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data || !Array.isArray(data.companies)) {
        throw new Error("Ongeldig antwoord");
      }

      const companies = data.companies;

      adminTable.innerHTML = companies
        .map((c) => {
          const status = c.isVerified
            ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Geverifieerd</span>`
            : `<span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Niet geverifieerd</span>`;

          return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-medium">${esc(c.name || "(naam onbekend)")}</td>
            <td class="p-3">${esc(c.ownerEmail || "-")}</td>
            <td class="p-3">${status}</td>
            <td class="p-3 text-center">${c.reviewCount || 0}</td>
            <td class="p-3 flex gap-3">
              <button class="verifyBtn text-green-600 text-sm" data-id="${c._id}">✔</button>
              <button class="deleteBtn text-red-600 text-sm" data-id="${c._id}">🗑</button>
            </td>
          </tr>`;
        })
        .join("");

      document.querySelectorAll(".verifyBtn").forEach((btn) =>
        btn.addEventListener("click", () => doVerifyCompany(btn.dataset.id))
      );
      document.querySelectorAll(".deleteBtn").forEach((btn) =>
        btn.addEventListener("click", () => doDeleteCompany(btn.dataset.id))
      );
    } catch (err) {
      if (retry < 3) {
        return setTimeout(() => loadAdminCompanies(retry + 1), 1500);
      }
      adminTable.innerHTML =
        '<tr><td colspan="5" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    }
  }

  async function doVerifyCompany(id) {
    if (!confirm("Verificatiestatus wijzigen?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/verify/${id}`, {
        method: "PUT",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fout");

      showNotif("✔ Verificatie gewijzigd");
      loadAdminCompanies();
    } catch {
      showNotif("❌ Fout bij verificatie", false);
    }
  }

  async function doDeleteCompany(id) {
    if (!confirm("Weet je zeker dat je dit bedrijf wilt verwijderen?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/company/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fout");

      showNotif("✔ Bedrijf verwijderd");
      loadAdminCompanies();
    } catch {
      showNotif("❌ Fout bij verwijderen", false);
    }
  }

  if (refreshCompaniesBtn)
    refreshCompaniesBtn.addEventListener("click", loadAdminCompanies);

  /* ============================================================
     GEMELDE REVIEWS
  ============================================================ */
  async function loadReportedReviews() {
    reportedTableBody.innerHTML =
      '<tr><td colspan="7" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_REPORTED);
      const list = await res.json();

      if (!res.ok || !Array.isArray(list)) throw new Error();

      if (!list.length) {
        reportedTableBody.innerHTML =
          '<tr><td colspan="7" class="p-4 text-center text-gray-400">Geen gemelde reviews.</td></tr>';
        return;
      }

      reportedTableBody.innerHTML = list
        .map((r) => {
          const resolved = r.status === "resolved" || r.reported === false;

          return `
          <tr class="border-b">
            <td class="p-3">${esc(r.company?.name || "Onbekend")}</td>
            <td class="p-3">${esc(r.reviewerName || "Onbekend")}</td>
            <td class="p-3">${r.rating ? "⭐".repeat(r.rating) : "-"}</td>
            <td class="p-3 max-w-xs truncate">${esc(r.message || "")}</td>
            <td class="p-3">${formatDate(r.createdAt)}</td>
            <td class="p-3">
              ${resolved
                ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Afgehandeld</span>`
                : `<button class="resolveBtn bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${r._id}">Markeer</button>`}
            </td>
          </tr>`;
        })
        .join("");

      document.querySelectorAll(".resolveBtn").forEach((btn) =>
        btn.addEventListener("click", () =>
          markReviewAsResolved(btn.dataset.id)
        )
      );
    } catch {
      reportedTableBody.innerHTML =
        '<tr><td colspan="7" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    }
  }

  async function markReviewAsResolved(id) {
    if (!confirm("Review afhandelen?")) return;
    try {
      const res = await fetch(ENDPOINT_RESOLVE_REPORTED(id), {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      showNotif("✔ Review afgehandeld");
      loadReportedReviews();
    } catch {
      showNotif("❌ Fout bij afhandelen", false);
    }
  }

  if (refreshReviewsBtn)
    refreshReviewsBtn.addEventListener("click", loadReportedReviews);

  /* ============================================================
     CLAIMS
  ============================================================ */
  async function loadClaims() {
    claimTableBody.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const json = await res.json();

      if (!res.ok || !Array.isArray(json.items)) throw new Error();

      const list = json.items;

      claimTableBody.innerHTML = list
        .map((c) => {
          return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3">${formatDate(c.createdAt)}</td>
            <td class="p-3">${esc(c.companyId?.name || "(onbekend)")}</td>
            <td class="p-3">${esc(c.contactName || "")}</td>
            <td class="p-3">${esc(c.contactEmail || "")}</td>
            <td class="p-3">${esc(c.contactPhone || "")}</td>
            <td class="p-3">${esc(c.status || "in behandeling")}</td>
          </tr>`;
        })
        .join("");
    } catch {
      claimTableBody.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    }
  }

  if (refreshClaimsBtn)
    refreshClaimsBtn.addEventListener("click", loadClaims);

  /* ============================================================
     SERVERLOGS
  ============================================================ */
  async function loadServerLogs() {
    logsContainer.innerHTML = "Laden...";
    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();
      if (!res.ok || !Array.isArray(logs)) throw new Error();

      logsContainer.innerHTML = logs
        .slice(-40)
        .reverse()
        .map((l) => `<div class="text-sm mb-1">${esc(l)}</div>`)
        .join("");
    } catch {
      logsContainer.innerHTML =
        '<div class="text-red-600">❌ Kan logs niet laden</div>';
    }
  }

  if (refreshLogsBtn)
    refreshLogsBtn.addEventListener("click", loadServerLogs);

  /* ============================================================
     INIT LOAD
  ============================================================ */
  loadAdminCompanies();
  loadReportedReviews();
  loadClaims();
  loadServerLogs();
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
