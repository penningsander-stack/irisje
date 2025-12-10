// frontend/js/admin.js
// v20251210-ADMIN-FIX

const API_BASE = "https://irisje-backend.onrender.com/api";

const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_COMPANIES = `${API_BASE}/admin/overview`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/admin/claims`;

const adminState = {
  companies: [],
  reported: [],
  claims: [],
  logs: [],
};

/* ============================================================
   BASIS HELPERFUNCTIES
============================================================ */
function byId(id) {
  return document.getElementById(id);
}

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function safeFetch(url, options = {}) {
  const { allow404, ...rest } = options || {};

  const mergedOptions = {
    ...rest,
    headers: {
      ...getAuthHeaders(),
      ...(rest.headers || {}),
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

    if (allow404 && res.status === 404) {
      console.warn("ℹ️ Endpoint niet gevonden (404):", url);
      return null;
    }

    const json =
      res.headers.get("content-type")?.includes("application/json")
        ? await res.json().catch(() => null)
        : null;

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
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity";
  notif.style.opacity = "0";
  document.body.appendChild(notif);
  return notif;
}

function showNotif(notif, message, success = true) {
  notif.textContent = message;
  notif.classList.remove("hidden");
  notif.classList.toggle("bg-green-600", success);
  notif.classList.toggle("bg-red-600", !success);
  notif.style.opacity = "1";
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => notif.classList.add("hidden"), 300);
  }, 2500);
}

function esc(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================
   INIT
============================================================ */
function initAdmin() {
  const notif = buildNotificationBar();

  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      showNotif(notif, "Je bent uitgelogd");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    });
  }

  const adminTabs = document.querySelectorAll(".admin-tab");
  const sections = ["section-overview", "section-reported", "section-claims", "section-logs"].map(
    (id) => byId(id)
  );

  adminTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      adminTabs.forEach((b) => b.classList.remove("active", "bg-indigo-600", "text-white"));
      adminTabs.forEach((b) =>
        b.classList.add("bg-gray-100", "text-gray-700")
      );

      btn.classList.add("active", "bg-indigo-600", "text-white");
      btn.classList.remove("bg-gray-100", "text-gray-700");

      sections.forEach((sec) => {
        if (!sec) return;
        sec.classList.toggle("hidden", sec.id !== targetId);
      });
    });
  });

  const adminTable = byId("adminCompanyTable");
  const refreshCompaniesBtn = byId("refreshCompaniesBtn");
  const reportedTableBody = byId("reportedCardsContainer");
  const refreshReportedBtn = byId("refreshReportedBtn");
  const claimTableBody = byId("claimsTableBody");
  const refreshClaimsBtn = byId("refreshClaimsBtn");
  const refreshLogsBtn = byId("refreshLogsBtn");
  const logsContainer = byId("logs-container");

  if (refreshCompaniesBtn)
    refreshCompaniesBtn.addEventListener("click", () =>
      loadAdminCompanies(adminTable, notif)
    );

  if (refreshReportedBtn)
    refreshReportedBtn.addEventListener("click", () =>
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

  // INIT LOAD (zonder logs-autorefresh om 404 spam te voorkomen)
  loadAdminCompanies(adminTable, notif);
  loadReportedReviews(reportedTableBody, notif);
  loadClaims(claimTableBody, notif);
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
    adminState.companies = Array.isArray(data) ? data : [];

    if (!adminState.companies.length) {
      table.innerHTML =
        '<tr><td colspan="5" class="p-4 text-center text-gray-400">Geen bedrijven gevonden.</td></tr>';
      return;
    }

    table.innerHTML = adminState.companies
      .map((c) => renderCompanyRow(c))
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

function renderCompanyRow(company) {
  const {
    _id,
    name,
    email,
    isVerified,
    reviewCount,
  } = company || {};

  const badgeClass = isVerified
    ? "bg-emerald-100 text-emerald-700"
    : "bg-yellow-100 text-yellow-700";

  const badgeText = isVerified ? "Geverifieerd" : "Nog niet geverifieerd";

  return `
    <tr class="border-b last:border-0">
      <td class="p-3 align-top">
        <div class="font-medium text-gray-900">${esc(name)}</div>
        <div class="text-xs text-gray-500">${esc(_id)}</div>
      </td>
      <td class="p-3 align-top text-sm">
        <a href="mailto:${esc(email)}" class="text-indigo-600 hover:underline">${esc(email)}</a>
      </td>
      <td class="p-3 align-top">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs ${badgeClass}">
          ${badgeText}
        </span>
      </td>
      <td class="p-3 align-top text-center text-sm">
        ${reviewCount ?? 0}
      </td>
      <td class="p-3 align-top text-sm space-x-2">
        <button
          class="verifyBtn inline-flex items-center px-2 py-1 rounded-md border border-gray-200 hover:border-indigo-500 text-xs"
          data-id="${esc(_id)}"
        >
          Verificatie togglen
        </button>
        <button
          class="deleteBtn inline-flex items-center px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-xs"
          data-id="${esc(_id)}"
        >
          Verwijderen
        </button>
      </td>
    </tr>
  `;
}

async function doVerifyCompany(id, notif, table) {
  if (!confirm("Verificatiestatus wijzigen?")) return;

  try {
    await safeFetch(`${API_BASE}/admin/verify/${id}`, { method: "PUT" });
    showNotif(notif, "✔ Verificatie gewijzigd");
    loadAdminCompanies(table, notif);
  } catch (err) {
    console.error(err);
    showNotif(notif, "❌ Fout bij verificatie", false);
  }
}

async function doDeleteCompany(id, notif, table) {
  if (!confirm("Weet je zeker dat je dit bedrijf wilt verwijderen?")) return;

  try {
    await safeFetch(`${API_BASE}/admin/companies/${id}`, { method: "DELETE" });
    showNotif(notif, "✔ Bedrijf verwijderd");
    loadAdminCompanies(table, notif);
  } catch (err) {
    console.error(err);
    showNotif(notif, "❌ Fout bij verwijderen bedrijf", false);
  }
}

/* ============================================================
   GEMELDE REVIEWS
============================================================ */
async function loadReportedReviews(container, notif) {
  if (!container) return;

  container.innerHTML =
    '<div class="text-xs text-gray-400">Laden...</div>';

  try {
    const data = await safeFetch(ENDPOINT_GET_REPORTED);
    adminState.reported = Array.isArray(data) ? data : [];

    if (!adminState.reported.length) {
      container.innerHTML =
        '<div class="text-xs text-gray-400">Geen gemelde reviews.</div>';
      updateReportedCounters();
      return;
    }

    container.innerHTML = adminState.reported
      .map((r) => renderReportedCard(r))
      .join("");

    updateReportedCounters();

    container.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        handleReportedAction(id, action, notif, container);
      });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML =
      '<div class="text-xs text-red-600">❌ Fout bij laden gemelde reviews</div>';
    showNotif(notif, "Fout bij laden gemelde reviews", false);
  }
}

function renderReportedCard(report) {
  const {
    _id,
    reviewId,
    companyName,
    reviewerName,
    reviewerEmail,
    rating,
    text,
    reason,
    details,
    createdAt,
    status,
  } = report || {};

  const statusBadge =
    status === "resolved"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-yellow-100 text-yellow-700";

  const statusText =
    status === "resolved" ? "Afgehandeld" : "Open";

  return `
    <article class="border border-gray-200 rounded-xl bg-white p-3 flex flex-col gap-2 shadow-sm">
      <header class="flex items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">${esc(
            companyName || "Onbekend bedrijf"
          )}</h3>
          <p class="text-xs text-gray-500">
            Reviewer: ${esc(reviewerName || "Onbekend")} – ${esc(
    reviewerEmail || ""
  )}
          </p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${statusBadge}">
            ${statusText}
          </span>
          <span class="text-[11px] text-gray-400">
            ${createdAt ? new Date(createdAt).toLocaleString("nl-NL") : ""}
          </span>
        </div>
      </header>

      <p class="text-sm text-gray-800">
        <span class="font-semibold">${rating ?? "-"}★</span> – ${esc(text || "")}
      </p>

      <div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
        <p class="font-semibold mb-0.5">Reden melding:</p>
        <p>${esc(reason || "Onbekend")}</p>
        ${
          details
            ? `<p class="mt-1 text-gray-500">${esc(details)}</p>`
            : ""
        }
      </div>

      <footer class="flex items-center justify-between gap-2 mt-1">
        <div class="flex gap-1.5">
          <button
            class="px-2 py-1 rounded-md text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            data-id="${esc(_id)}"
            data-action="keep"
          >
            Review laten staan
          </button>
          <button
            class="px-2 py-1 rounded-md text-xs border border-red-200 text-red-700 hover:bg-red-50"
            data-id="${esc(_id)}"
            data-action="remove"
          >
            Review verwijderen
          </button>
        </div>
        <a
          href="company.html?id=${encodeURIComponent(
            report.companyId || ""
          )}#reviews"
          class="text-xs text-indigo-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Bekijk bedrijfsprofiel
        </a>
      </footer>
    </article>
  `;
}

async function handleReportedAction(id, action, notif, container) {
  if (!id || !action) return;

  const confirmText =
    action === "remove"
      ? "Weet je zeker dat je deze review wilt verwijderen?"
      : "Weet je zeker dat je deze melding wilt afhandelen en de review laten staan?";

  if (!confirm(confirmText)) return;

  try {
    const body = { action };
    await safeFetch(ENDPOINT_RESOLVE_REPORTED(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    showNotif(notif, "✔ Review afgehandeld");
    loadReportedReviews(container, notif);
  } catch (err) {
    console.error(err);
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
    const claims = await safeFetch(ENDPOINT_GET_CLAIMS);
    adminState.claims = Array.isArray(claims) ? claims : [];

    if (!adminState.claims.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-gray-400">Geen claims gevonden.</td></tr>';
      return;
    }

    tbody.innerHTML = adminState.claims
      .map((claim) => renderClaimRow(claim))
      .join("");

    tbody.querySelectorAll("[data-claim-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const action = btn.dataset.claimAction;
        handleClaimAction(id, action, notif, tbody);
      });
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Fout bij laden claims</td></tr>';
    showNotif(notif, "Fout bij laden claims", false);
  }
}

function renderClaimRow(claim) {
  const {
    _id,
    createdAt,
    customerName,
    companyName,
    type,
    status,
  } = claim || {};

  const statusClass =
    status === "resolved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-blue-100 text-blue-700";

  const statusText =
    status === "resolved"
      ? "Afgehandeld"
      : status === "rejected"
      ? "Afgewezen"
      : "Open";

  return `
    <tr class="border-b last:border-0">
      <td class="p-3 text-xs text-gray-500 align-top">
        ${createdAt ? new Date(createdAt).toLocaleDateString("nl-NL") : "-"}
      </td>
      <td class="p-3 text-sm align-top">${esc(customerName || "-")}</td>
      <td class="p-3 text-sm align-top">${esc(companyName || "-")}</td>
      <td class="p-3 text-xs align-top">${esc(type || "-")}</td>
      <td class="p-3 align-top">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs ${statusClass}">
          ${statusText}
        </span>
      </td>
      <td class="p-3 align-top text-right text-xs space-x-1">
        <button
          class="px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          data-id="${esc(_id)}"
          data-claim-action="resolve"
        >
          Markeer als afgehandeld
        </button>
        <button
          class="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
          data-id="${esc(_id)}"
          data-claim-action="reject"
        >
          Afwijzen
        </button>
      </td>
    </tr>
  `;
}

async function handleClaimAction(id, action, notif, tbody) {
  if (!id || !action) return;

  const confirmText =
    action === "reject"
      ? "Weet je zeker dat je deze claim wilt afwijzen?"
      : "Weet je zeker dat je deze claim wilt markeren als afgehandeld?";

  if (!confirm(confirmText)) return;

  try {
    await safeFetch(`${API_BASE}/admin/claims/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    showNotif(notif, "✔ Claim bijgewerkt");
    loadClaims(tbody, notif);
  } catch (err) {
    console.error(err);
    showNotif(notif, "❌ Fout bij bijwerken claim", false);
  }
}

/* ============================================================
   LOGS
============================================================ */
async function loadServerLogs(container, notif) {
  if (!container) return;

  container.innerHTML = '<div class="text-xs text-gray-500">Laden...</div>';

  try {
    const logs = await safeFetch(ENDPOINT_GET_LOGS, { allow404: true });
    const list = Array.isArray(logs) ? logs.slice(-100).reverse() : [];

    adminState.logs = list;

    if (!list.length) {
      container.innerHTML =
        '<div class="text-xs text-gray-500">Geen logs beschikbaar of endpoint niet geactiveerd.</div>';
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
    return `<div class="text-xs text-gray-800 whitespace-pre-wrap">${esc(entry)}</div>`;
  }

  const { level, message, timestamp } = entry;
  const lvl = (level || "info").toLowerCase();
  const when = timestamp ? new Date(timestamp).toLocaleString("nl-NL") : "";
  const msg = message || "";

  const badge =
    lvl === "error"
      ? "bg-red-100 text-red-700"
      : lvl === "warn"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return `
    <div class="text-xs bg-white border border-gray-200 rounded px-2 py-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[10px] text-gray-500">${esc(when)}</span>
        <span class="px-1.5 py-0.5 text-[10px] rounded ${badge}">${esc(lvl)}</span>
      </div>
      <div class="text-[11px] text-gray-800 break-words whitespace-pre-wrap">${esc(msg)}</div>
    </div>
  `;
}

/* ============================================================
   DOM READY
============================================================ */
document.addEventListener("DOMContentLoaded", initAdmin);
