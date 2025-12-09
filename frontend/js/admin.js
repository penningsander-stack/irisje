// frontend/js/admin.js
// v20251209-ADMIN-FIX-LOGOS-BUTTON
//
// Bevat:
// - Admin-dashboard logica (bedrijven, gemelde reviews, claims, logs)
// - JWT-check en redirect naar login
// - Nieuw: optionele knop om /admin/fix-logos aan te roepen (logo's automatisch koppelen)

const API_BASE = "https://irisje-backend.onrender.com/api";

const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_COMPANIES = `${API_BASE}/admin/overview`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/admin/claims`;
const ENDPOINT_FIX_LOGOS = `${API_BASE}/admin/fix-logos`;

const adminState = {
  companies: [],
  reported: [],
  claims: [],
  logs: [],
};

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251209-ADMIN-FIX-LOGOS-BUTTON)");

  // 🔐 BASISCHECK — GEEN JWT? → TERUG NAAR LOGIN
  const token = localStorage.getItem("token");
  if (!token) {
    return (window.location.href = "login.html");
  }

  const role = localStorage.getItem("userRole");
  if (role !== "admin") {
    return (window.location.href = "login.html");
  }

  // DOM
  const logoutBtn = byId("logoutBtn");
  const refreshCompaniesBtn = byId("refreshCompanies");
  const refreshReviewsBtn = byId("refreshBtn");
  const refreshClaimsBtn = byId("refreshClaims");
  const refreshLogsBtn = byId("refreshLogsBtn");
  const fixLogosBtn = byId("fixLogosBtn"); // ✅ nieuwe knop (optioneel)

  const adminTable = byId("adminCompanyTable");
  const reportedTableBody = byId("reported-table-body");
  const claimTableBody = byId("claimTableBody");
  const logsContainer = byId("logs-container");

  // Notificatie
  const notif = buildNotificationBar();

  // 🔴 LOGOUT (JWT → alleen localStorage wissen)
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "login.html";
    });
  }

  // Sidebar navigatie
  initSidebarNavigation();

  // Events
  if (refreshCompaniesBtn)
    refreshCompaniesBtn.addEventListener("click", () =>
      loadAdminCompanies(adminTable, notif)
    );

  if (refreshReviewsBtn)
    refreshReviewsBtn.addEventListener("click", () =>
      loadReportedReviews(reportedTableBody, notif)
    );

  if (refreshClaimsBtn)
    refreshClaimsBtn.addEventListener("click", () =>
      loadClaims(claimTableBody, notif)
    );

  if (refreshLogsBtn)
    refreshLogsBtn.addEventListener("click", () =>
      loadServerLogs(logsContainer, notif)
    );

  if (fixLogosBtn)
    fixLogosBtn.addEventListener("click", () => runLogoFix(notif)); // ✅ nieuw

  // INIT LOAD
  loadAdminCompanies(adminTable, notif);
  loadReportedReviews(reportedTableBody, notif);
  loadClaims(claimTableBody, notif);
  loadServerLogs(logsContainer, notif);
  setInterval(() => loadServerLogs(logsContainer, notif), 30000);
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
        (
          {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }
        )[s]
      );
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (isNaN(d)) return "-";
  return d.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function safeFetch(url, options = {}) {
  const mergedOptions = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, mergedOptions);

    // 401/403 → TERUG NAAR LOGIN
    if (res.status === 401 || res.status === 403) {
      console.warn("❌ Ongeldige sessie → redirect naar login");
      localStorage.clear();
      return (window.location.href = "login.html");
    }

    const isJson =
      res.headers.get("content-type")?.includes("application/json");
    const json = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const msg =
        json?.error ||
        json?.message ||
        `Fout ${res.status} bij ${url}`;
      throw new Error(msg);
    }

    return json;
  } catch (err) {
    console.error("❌ Fout bij safeFetch:", url, err);
    throw err;
  }
}

function buildNotificationBar() {
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity";
  notif.style.opacity = "0";
  document.body.appendChild(notif);
  return notif;
}

function showNotif(notif, message, success = true) {
  if (!notif) return;
  notif.textContent = message;
  notif.classList.remove("hidden");
  notif.classList.toggle("bg-green-600", success);
  notif.classList.toggle("bg-red-600", !success);
  notif.style.opacity = "1";
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => notif.classList.add("hidden"), 300);
  }, 1600);
}

function initSidebarNavigation() {
  const nav = byId("adminNav");
  if (!nav) return;

  const buttons = Array.from(nav.querySelectorAll(".nav-item"));
  const sections = ["section-overview", "section-reported", "section-claims", "section-logs"].map(
    (id) => byId(id)
  );

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.section;

      buttons.forEach((b) =>
        b.classList.remove("bg-indigo-50", "text-indigo-700")
      );
      btn.classList.add("bg-indigo-50", "text-indigo-700");

      sections.forEach((section) => {
        if (!section) return;
        section.classList.toggle("hidden", section.id !== targetId);
      });
    });
  });
}

/* ============================================================
   BEDRIJVEN
============================================================ */
async function loadAdminCompanies(table, notif) {
  if (!table) return;
  table.innerHTML =
    '<tr><td colspan="5" class="p-4 text-center text-gray-400">Laden...</td></tr>';

  try {
    const data = await safeFetch(ENDPOINT_GET_COMPANIES);

    if (!data || !Array.isArray(data.companies)) {
      throw new Error("Ongeldig antwoord van /admin/overview");
    }

    const companies = data.companies;
    adminState.companies = companies;

    if (!companies.length) {
      table.innerHTML =
        '<tr><td colspan="5" class="p-4 text-center text-gray-400">Geen bedrijven gevonden.</td></tr>';
      return;
    }

    table.innerHTML = companies
      .map(
        (c) => `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-medium">${esc(c.name)}</td>
            <td class="p-3">${esc(c.ownerEmail || "-")}</td>
            <td class="p-3">
              ${
                c.isVerified
                  ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Geverifieerd</span>`
                  : `<span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">Niet geverifieerd</span>`
              }
            </td>
            <td class="p-3 text-center">${c.reviewCount || 0}</td>
            <td class="p-3 flex gap-3">
              <button class="verifyBtn text-green-600 text-sm" data-id="${c._id}">✔</button>
              <button class="deleteBtn text-red-600 text-sm" data-id="${c._id}">🗑</button>
            </td>
          </tr>`
      )
      .join("");

    table.querySelectorAll(".verifyBtn").forEach((btn) =>
      btn.addEventListener("click", () =>
        doVerifyCompany(btn.dataset.id, notif, table)
      )
    );
    table.querySelectorAll(".deleteBtn").forEach((btn) =>
      btn.addEventListener("click", () =>
        doDeleteCompany(btn.dataset.id, notif, table)
      )
    );
  } catch (err) {
    console.error(err);
    table.innerHTML =
      '<tr><td colspan="5" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    showNotif(notif, "Fout bij laden bedrijven", false);
  }
}

async function doVerifyCompany(id, notif, table) {
  if (!confirm("Verificatiestatus wijzigen?")) return;

  try {
    await safeFetch(`${API_BASE}/admin/verify/${id}`, { method: "PUT" });
    showNotif(notif, "✔ Verificatie gewijzigd");
    loadAdminCompanies(table, notif);
  } catch {
    showNotif(notif, "❌ Fout bij verificatie", false);
  }
}

async function doDeleteCompany(id, notif, table) {
  if (!confirm("Bedrijf verwijderen?")) return;

  try {
    await safeFetch(`${API_BASE}/admin/company/${id}`, { method: "DELETE" });
    showNotif(notif, "✔ Bedrijf verwijderd");
    loadAdminCompanies(table, notif);
  } catch {
    showNotif(notif, "❌ Fout bij verwijderen", false);
  }
}

/* ============================================================
   GEMELDE REVIEWS
============================================================ */
async function loadReportedReviews(tbody, notif) {
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="8" class="p-4 text-center text-gray-400">Laden...</td></tr>';

  try {
    const list = await safeFetch(ENDPOINT_GET_REPORTED);

    adminState.reported = Array.isArray(list) ? list : [];

    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="p-4 text-center text-gray-400">Geen gemelde reviews.</td></tr>';
      updateReportedCounters();
      return;
    }

    tbody.innerHTML = list
      .map((r) => {
        const resolved = r.status === "resolved" || r.reported === false;
        const rating =
          typeof r.rating === "number"
            ? "⭐".repeat(Math.round(r.rating))
            : "-";

        const reason =
          r.reason || r.reportReason || r.flagReason || r.reportText || "";

        return `
          <tr class="border-b align-top">
            <td class="p-3">${esc(r.company?.name || "Onbekend")}</td>
            <td class="p-3">${esc(r.reviewerName || r.userName || "Onbekend")}</td>
            <td class="p-3">${rating}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(
          r.message || ""
        )}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(reason)}">${esc(
          reason || "(geen reden opgegeven)"
        )}</td>
            <td class="p-3">${formatDate(r.createdAt)}</td>
            <td class="p-3">
              ${
                resolved
                  ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Afgehandeld</span>`
                  : `<span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Open</span>`
              }
            </td>
            <td class="p-3">
              ${
                resolved
                  ? ""
                  : `<button class="resolveBtn bg-green-600 text-white text-xs px-2 py-1 rounded" data-id="${esc(
                      r._id
                    )}">Markeer afgehandeld</button>`
              }
            </td>
          </tr>`;
      })
      .join("");

    tbody.querySelectorAll(".resolveBtn").forEach((btn) =>
      btn.addEventListener("click", () =>
        markReviewAsResolved(btn.dataset.id, notif, tbody)
      )
    );

    updateReportedCounters();
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="8" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    showNotif(notif, "Fout bij laden reviews", false);
    updateReportedCounters();
  }
}

async function markReviewAsResolved(id, notif, tbody) {
  if (!confirm("Review afhandelen?")) return;

  try {
    await safeFetch(ENDPOINT_RESOLVE_REPORTED(id), { method: "PATCH" });
    showNotif(notif, "✔ Review afgehandeld");
    loadReportedReviews(tbody, notif);
  } catch {
    showNotif(notif, "❌ Fout bij afhandelen", false);
  }
}

function updateReportedCounters() {
  const total = adminState.reported.length;
  const openCount = adminState.reported.filter(
    (r) => !(r.status === "resolved" || r.reported === false)
  ).length;
  const resolvedCount = total - openCount;

  const totalEl = byId("total-reported");
  const openEl = byId("open-reported");
  const resolvedEl = byId("resolved-reported");

  if (totalEl) totalEl.textContent = total;
  if (openEl) openEl.textContent = openCount;
  if (resolvedEl) resolvedEl.textContent = resolvedCount;
}

/* ============================================================
   CLAIMS
============================================================ */
async function loadClaims(tbody, notif) {
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" class="p-4 text-center text-gray-400">Laden...</td></tr>';

  try {
    const json = await safeFetch(ENDPOINT_GET_CLAIMS);
    const list = Array.isArray(json?.items) ? json.items : [];

    adminState.claims = list;

    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-gray-400">Geen claims.</td></tr>';
      return;
    }

    tbody.innerHTML = list
      .map((c) => {
        const status = c.status || "in behandeling";
        const badge =
          status === "goedgekeurd"
            ? "bg-green-100 text-green-700"
            : status === "afgewezen"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";

        return `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3">${formatDate(c.createdAt)}</td>
            <td class="p-3">${esc(c.companyId?.name)}</td>
            <td class="p-3">${esc(c.contactName || "")}</td>
            <td class="p-3">${esc(c.contactEmail || "")}</td>
            <td class="p-3">${esc(c.contactPhone || "")}</td>
            <td class="p-3">
              <span class="px-2 py-1 text-xs rounded ${badge}">${esc(
          status
        )}</span>
            </td>
          </tr>`;
      })
      .join("");
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Laden mislukt</td></tr>';
    showNotif(notif, "Fout bij laden claims", false);
  }
}

/* ============================================================
   LOGS
============================================================ */
async function loadServerLogs(container, notif) {
  if (!container) return;
  container.innerHTML = '<div class="text-xs text-gray-500">Laden...</div>';

  try {
    const logs = await safeFetch(ENDPOINT_GET_LOGS);
    const list = Array.isArray(logs) ? logs.slice(-100).reverse() : [];

    adminState.logs = list;

    if (!list.length) {
      container.innerHTML =
        '<div class="text-xs text-gray-500">Geen logs beschikbaar.</div>';
      return;
    }

    container.innerHTML = list.map((entry) => renderLogEntry(entry)).join("");
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="text-xs text-red-600">❌ Kan logs niet laden</div>';
    showNotif(notif, "Fout bij laden logs", false);
  }
}

function renderLogEntry(entry) {
  if (typeof entry === "string") {
    return `<div class="text-xs bg-white border border-gray-200 rounded px-2 py-1">${esc(
      entry
    )}</div>`;
  }

  const when = formatDate(entry.timestamp || entry.createdAt || entry.time);
  const level = (entry.level || "info").toUpperCase();
  const msg =
    entry.message ||
    entry.msg ||
    entry.detail ||
    JSON.stringify(entry).slice(0, 300);

  const badge =
    level === "ERROR"
      ? "bg-red-100 text-red-700"
      : level === "WARN"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return `
    <div class="text-xs bg-white border border-gray-200 rounded px-2 py-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] text-gray-500">${esc(when)}</span>
        <span class="px-1.5 py-0.5 text-[10px] rounded ${badge}">${esc(
          level
        )}</span>
      </div>
      <div class="text-[11px] text-gray-800 break-words">${esc(msg)}</div>
    </div>`;
}

/* ============================================================
   LOGO FIX (NIEUW)
//  Roept het backend endpoint /admin/fix-logos aan
============================================================ */
async function runLogoFix(notif) {
  if (!confirm("Automatisch logo's toewijzen aan bedrijven zonder logo?")) {
    return;
  }

  try {
    const result = await safeFetch(ENDPOINT_FIX_LOGOS, {
      method: "POST",
    });

    if (result?.ok) {
      showNotif(
        notif,
        result.message || `✔ Logo's toegewezen aan ${result.updated || 0} bedrijven`,
        true
      );
    } else {
      showNotif(
        notif,
        result?.error || "Onbekende fout bij logo-fix",
        false
      );
    }
  } catch (err) {
    console.error("Fout bij runLogoFix:", err);
    showNotif(notif, err.message || "Fout bij logo-fix", false);
  }
}
