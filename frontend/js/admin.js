// frontend/js/admin.js
// v20251210-ADMIN-ALIGN-BACKEND-FIXED + LIVE-SEARCH-COMPANIES
//
// Deze versie is afgestemd op de bestaande backend-routes in backend/routes/admin.js:
// - GET    /api/admin/companies
// - GET    /api/admin/reported-reviews
// - POST   /api/admin/reported-reviews/:id/clear
// - GET    /api/admin/claims
// - POST   /api/admin/claims/:id/approve
// - POST   /api/admin/claims/:id/reject
// - GET    /api/admin/logs   (extra route, zie bijgewerkte backend/routes/admin.js)

const API_BASE = "https://irisje-backend.onrender.com/api/admin";
let adminCompaniesCache = [];

/* ============================================================
   HELPERFUNCTIES
============================================================ */
function byId(id) {
  return document.getElementById(id);
}

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function safeFetch(url, options = {}) {
  const { allow404, ...rest } = options || {};
  const mergedOptions = {
    ...rest,
    headers: {
      ...(rest.headers || {}),
      ...getAuthHeaders(),
    },
  };

  try {
    const res = await fetch(url, mergedOptions);

    // 401/403 = sessie verlopen -> naar login
    if (res.status === 401 || res.status === 403) {
      console.warn("[admin] 401/403 → redirect naar login");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return null;
    }

    if (allow404 && res.status === 404) {
      console.warn("[admin] 404 (allow404) op", url);
      return null;
    }

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const msg =
        (data && (data.error || data.message)) ||
        `Fout ${res.status} bij ${url}`;
      throw new Error(msg);
    }

    return data;
  } catch (err) {
    console.error("[admin] safeFetch-fout voor", url, err);
    throw err;
  }
}

function buildNotificationBar() {
  const el = document.createElement("div");
  el.id = "adminNotif";
  el.className =
    "hidden fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity";
  el.style.opacity = "0";
  document.body.appendChild(el);
  return el;
}

function showNotif(notifEl, msg, ok = true) {
  if (!notifEl) return;
  notifEl.textContent = msg;
  notifEl.classList.remove("hidden");
  notifEl.classList.toggle("bg-green-600", ok);
  notifEl.classList.toggle("bg-red-600", !ok);
  notifEl.style.opacity = "1";
  setTimeout(() => {
    notifEl.style.opacity = "0";
    setTimeout(() => notifEl.classList.add("hidden"), 250);
  }, 2200);
}

function esc(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&quot;");
}

/* ============================================================
   INIT
============================================================ */

function initAdmin() {
  const notif = buildNotificationBar();

  // Logout-knop
  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      showNotif(notif, "Je bent uitgelogd");
      setTimeout(() => (window.location.href = "login.html"), 700);
    });
  }

  // Tabs
  const tabButtons = document.querySelectorAll(".admin-tab");
  const sectionIds = ["section-overview", "section-reported", "section-claims", "section-logs"];
  const sections = sectionIds.map((id) => byId(id));

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");

      tabButtons.forEach((b) => {
        b.classList.remove("active", "bg-indigo-600", "text-white");
        b.classList.add("bg-gray-100", "text-gray-700");
      });

      btn.classList.add("active", "bg-indigo-600", "text-white");
      btn.classList.remove("bg-gray-100", "text-gray-700");

      sections.forEach((sec) => {
        if (!sec) return;
        sec.classList.toggle("hidden", sec.id !== target);
      });
    });
  });

  // Elementen
  const companiesTableBody = byId("adminCompanyTable");
  const refreshCompaniesBtn = byId("refreshCompaniesBtn");
  const companySearchInput = byId("companySearch");
  const reportedContainer = byId("reportedCardsContainer");
  const refreshReportedBtn = byId("refreshReportedBtn");
  const claimsTableBody = byId("claimsTableBody");
  const refreshClaimsBtn = byId("refreshClaimsBtn");
  const logsContainer = byId("logs-container");
  const refreshLogsBtn = byId("refreshLogsBtn");

  // Events
  if (refreshCompaniesBtn && companiesTableBody) {
    refreshCompaniesBtn.addEventListener("click", () =>
      loadCompanies(companiesTableBody, notif)
    );
  }
  if (companySearchInput && companiesTableBody) {
    companySearchInput.addEventListener("input", () => {
      renderCompaniesFromCache(companiesTableBody, companySearchInput.value);
    });
  }
  if (refreshReportedBtn && reportedContainer) {
    refreshReportedBtn.addEventListener("click", () =>
      loadReportedReviews(reportedContainer, notif)
    );
  }
  if (refreshClaimsBtn && claimsTableBody) {
    refreshClaimsBtn.addEventListener("click", () =>
      loadClaims(claimsTableBody, notif)
    );
  }
  if (refreshLogsBtn && logsContainer) {
    refreshLogsBtn.addEventListener("click", () =>
      loadLogs(logsContainer, notif)
    );
  }

  // Initial load (bewust geen auto-refresh logs)
  if (companiesTableBody) loadCompanies(companiesTableBody, notif);
  if (reportedContainer) loadReportedReviews(reportedContainer, notif);
  if (claimsTableBody) loadClaims(claimsTableBody, notif);
}

/* ============================================================
   BEDRIJVEN
============================================================ */

async function loadCompanies(tbody, notif) {
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="4" class="p-4 text-center text-gray-400">Laden...</td></tr>';

  try {
    const data = await safeFetch(`${API_BASE}/companies`);
    const companies = Array.isArray(data)
      ? data
      : Array.isArray(data?.companies)
      ? data.companies
      : [];

    adminCompaniesCache = companies;

    const searchInput = byId("companySearch");

    if (!adminCompaniesCache.length) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="p-4 text-center text-gray-400">Geen bedrijven gevonden.</td></tr>';
      return;
    }

    renderCompaniesFromCache(tbody, searchInput ? searchInput.value : "");
  } catch (err) {
    console.error("[admin] loadCompanies-fout", err);
    tbody.innerHTML =
      '<tr><td colspan="4" class="p-4 text-center text-red-600">❌ Kon bedrijven niet laden</td></tr>';
    showNotif(notif, "Kon bedrijven niet laden", false);
  }
}

function renderCompaniesFromCache(tbody, searchValue) {
  if (!tbody) return;

  const term = (searchValue || "").trim().toLowerCase();
  let list = Array.isArray(adminCompaniesCache) ? adminCompaniesCache.slice() : [];

  if (term) {
    list = list.filter((company) => {
      const name = (company?.name || "").toLowerCase();
      const email = (company?.email || "").toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }

  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="p-4 text-center text-gray-400">Geen bedrijven gevonden.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(renderCompanyRow).join("");
}

function renderCompanyRow(company) {
  const name = esc(company?.name || "Onbekend bedrijf");
  const email = esc(company?.email || "");
  const verified = !!(company?.verified || company?.isVerified);
  const created = company?.createdAt
    ? new Date(company.createdAt).toLocaleDateString("nl-NL")
    : "-";

  const badgeClass = verified
    ? "bg-emerald-50 text-emerald-600"
    : "bg-yellow-50 text-yellow-500";

  const badgeText = verified ? "Geverifieerd" : "Nog niet geverifieerd";

  return `
    <tr class="border-b last:border-0">
      <td class="p-3 align-top text-sm">
        <div class="font-semibold text-gray-800">${name}</div>
        <div class="text-xs text-gray-500 mt-0.5">${created}</div>
      </td>
      <td class="p-3 align-top text-sm">
        ${
          email
            ? `<a href="mailto:${email}" class="text-indigo-600 hover:underline">${email}</a>`
            : '<span class="text-xs text-gray-400">geen e-mailadres bekend</span>'
        }
      </td>
      <td class="p-3 align-top">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs ${badgeClass}">
          ${badgeText}
        </span>
      </td>
      <td class="p-3 align-top text-right text-xs">
        <a
          href="results.html?company=${encodeURIComponent(company?._id || "")}"
          class="text-indigo-600 hover:underline"
        >
          Bekijk bedrijf
        </a>
      </td>
    </tr>
  `;
}

/* ============================================================
   GEMELDE REVIEWS
============================================================ */

async function loadReportedReviews(container, notif) {
  if (!container) return;
  container.innerHTML =
    '<div class="text-xs text-gray-400">Laden...</div>';

  try {
    const data = await safeFetch(`${API_BASE}/reported-reviews`);
    const reviews = Array.isArray(data)
      ? data
      : Array.isArray(data?.reviews)
      ? data.reviews
      : [];

    if (!reviews.length) {
      container.innerHTML =
        '<div class="text-xs text-gray-400">Geen gemelde reviews.</div>';
      return;
    }

    container.innerHTML = reviews.map(renderReportedCard).join("");

    // Actieknoppen (alleen "melding verwijderen", want backend kent geen harde delete)
    container.querySelectorAll("[data-report-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-report-id");
        if (!id) return;
        handleClearReport(id, notif, container);
      });
    });
  } catch (err) {
    console.error("[admin] loadReportedReviews-fout", err);
    container.innerHTML =
      '<div class="text-xs text-red-600">❌ Kon gemelde reviews niet laden</div>';
    showNotif(notif, "Kon gemelde reviews niet laden", false);
  }
}

function renderReportedCard(review) {
  const companyName = esc(review?.companyName || "Onbekend bedrijf");
  const reviewerName = esc(review?.name || review?.reviewerName || "Onbekende reviewer");
  const email = esc(review?.email || review?.reviewerEmail || "");
  const rating = review?.rating ?? "-";
  const text = esc(review?.text || review?.comment || "");
  const created = review?.createdAt
    ? new Date(review.createdAt).toLocaleString("nl-NL")
    : "";
  const reason = esc(review?.reportReason || review?.reason || "Geen reden opgeslagen");

  return `
    <article class="border border-gray-200 rounded-xl bg-white p-3 flex flex-col gap-2 shadow-sm">
      <header class="flex items-start justify-between gap-2">
        <div>
          <h3 class="text-sm font-semibold text-gray-900">${companyName}</h3>
          <p class="text-xs text-gray-500">
            Reviewer: ${reviewerName}${email ? " – " + email : ""}
          </p>
        </div>
        <span class="text-[11px] text-gray-400">${created}</span>
      </header>

      <p class="text-sm text-gray-800">
        <span class="font-semibold">${rating}★</span> – ${text}
      </p>

      <div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
        <p class="font-semibold mb-0.5">Reden melding:</p>
        <p>${reason}</p>
      </div>

      <footer class="flex items-center justify-between gap-2 mt-1">
        <button
          class="px-2 py-1 rounded-md text-xs border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          data-report-id="${esc(review?._id || "")}"
        >
          Melding verwijderen
        </button>
      </footer>
    </article>
  `;
}

async function handleClearReport(id, notif, container) {
  if (!id) return;
  if (!confirm("Weet je zeker dat je de melding van deze review wilt verwijderen?")) return;

  try {
    await safeFetch(`${API_BASE}/reported-reviews/${encodeURIComponent(id)}/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    showNotif(notif, "Melding verwijderd");
    loadReportedReviews(container, notif);
  } catch (err) {
    console.error("[admin] handleClearReport-fout", err);
    showNotif(notif, "Kon melding niet verwijderen", false);
  }
}

/* ============================================================
   CLAIMS
============================================================ */

async function loadClaims(tbody, notif) {
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="6" class="p-4 text-center text-gray-400">Laden...</td></tr>';

  try {
    const data = await safeFetch(`${API_BASE}/claims`);
    const claims = Array.isArray(data)
      ? data
      : Array.isArray(data?.claims)
      ? data.claims
      : [];

    if (!claims.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-gray-400">Geen claims gevonden.</td></tr>';
      return;
    }

    tbody.innerHTML = claims.map(renderClaimRow).join("");

    tbody.querySelectorAll("[data-claim-approve]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-claim-approve");
        handleClaimAction(id, "approve", notif, tbody);
      });
    });

    tbody.querySelectorAll("[data-claim-reject]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-claim-reject");
        handleClaimAction(id, "reject", notif, tbody);
      });
    });
  } catch (err) {
    console.error("[admin] loadClaims-fout", err);
    tbody.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Kon claims niet laden</td></tr>';
    showNotif(notif, "Kon claims niet laden", false);
  }
}

function renderClaimRow(claim) {
  const id = esc(claim?._id || "");
  const created = claim?.createdAt
    ? new Date(claim.createdAt).toLocaleDateString("nl-NL")
    : "-";
  const customerName = esc(claim?.customerName || claim?.name || "-");
  const companyName = esc(claim?.companyId?.name || claim?.companyName || "-");
  const type = esc(claim?.type || "-");

  return `
    <tr class="border-b last:border-0">
      <td class="p-3 text-xs text-gray-500 align-top">${created}</td>
      <td class="p-3 text-sm align-top">${customerName}</td>
      <td class="p-3 text-sm align-top">${companyName}</td>
      <td class="p-3 text-xs align-top">${type}</td>
      <td class="p-3 align-top text-xs text-gray-500">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">
          Open
        </span>
      </td>
      <td class="p-3 align-top text-right text-xs space-x-1">
        <button
          class="px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          data-claim-approve="${id}"
        >
          Goedkeuren
        </button>
        <button
          class="px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
          data-claim-reject="${id}"
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
    action === "approve"
      ? "Weet je zeker dat je deze claim wilt goedkeuren? Het bedrijf wordt dan geverifieerd."
      : "Weet je zeker dat je deze claim wilt afwijzen?";

  if (!confirm(confirmText)) return;

  const endpoint =
    action === "approve"
      ? `${API_BASE}/claims/${encodeURIComponent(id)}/approve`
      : `${API_BASE}/claims/${encodeURIComponent(id)}/reject`;

  try {
    await safeFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    showNotif(notif, "Claim bijgewerkt");
    loadClaims(tbody, notif);
  } catch (err) {
    console.error("[admin] handleClaimAction-fout", err);
    showNotif(notif, "Kon claim niet bijwerken", false);
  }
}

/* ============================================================
   LOGS
============================================================ */

async function loadLogs(container, notif) {
  if (!container) return;
  container.innerHTML = '<div class="text-xs text-gray-500">Laden...</div>';

  try {
    const data = await safeFetch(`${API_BASE}/logs`, { allow404: true });
    const logs = Array.isArray(data) ? data : [];

    if (!logs.length) {
      container.innerHTML =
        '<div class="text-xs text-gray-500">Geen logs beschikbaar of logging nog niet geactiveerd.</div>';
      return;
    }

    container.innerHTML = logs.map(renderLogEntry).join("");
  } catch (err) {
    console.error("[admin] loadLogs-fout", err);
    container.innerHTML =
      '<div class="text-xs text-red-600">❌ Kon logs niet laden</div>';
    showNotif(notif, "Kon logs niet laden", false);
  }
}

function renderLogEntry(entry) {
  if (typeof entry === "string") {
    return `<div class="text-xs text-gray-800 whitespace-pre-wrap">${esc(entry)}</div>`;
  }

  const level = (entry.level || "info").toLowerCase();
  const ts = entry.timestamp
    ? new Date(entry.timestamp).toLocaleString("nl-NL")
    : "";
  const msg = esc(entry.message || "");

  const badgeClass =
    level === "error"
      ? "bg-red-50 text-red-600"
      : level === "debug" || level === "warn"
      ? "bg-yellow-50 text-yellow-500"
      : "bg-emerald-50 text-emerald-600";

  return `
    <div class="text-xs bg-white border border-gray-200 rounded px-2 py-1">
      <div class="flex items-center justify-between mb-1">
        <span class="text-[11px] text-gray-400">${ts}</span>
        <span class="px-1.5 py-0.5 text-[10px] rounded ${badgeClass}">
          ${esc(level.toUpperCase())}
        </span>
      </div>
      <div class="text-[11px] text-gray-800 break-words whitespace-pre-wrap">${msg}</div>
    </div>
  `;
}

/* ============================================================
   DOM READY
============================================================ */

document.addEventListener("DOMContentLoaded", initAdmin);
