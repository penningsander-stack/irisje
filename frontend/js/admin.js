// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/claims/all`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251114-FINAL)");

  const logoutBtn = byId("logoutBtn");
  const refreshReviewsBtn = byId("refreshBtn");
  const refreshLogsBtn = byId("refreshLogsBtn");
  const logsContainer = byId("logs-container");
  const adminTable = byId("adminCompanyTable");
  const refreshCompaniesBtn = byId("refreshCompanies");
  const claimTable = byId("claimTableBody");

  /* ============================================================
     NOTIFICATIE
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
     SIDEBAR NAVIGATIE
  ============================================================ */
  const nav = byId("adminNav");
  if (nav) {
    nav.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.section;

        nav.querySelectorAll(".nav-item").forEach((b) =>
          b.classList.remove("bg-indigo-50", "text-indigo-700")
        );
        btn.classList.add("bg-indigo-50", "text-indigo-700");

        document.querySelectorAll("main section[id^='section-']").forEach((s) =>
          s.classList.add("hidden")
        );

        const active = byId(target);
        if (active) active.classList.remove("hidden");
      });
    });
  }

  /* ============================================================
     LOGOUT
  ============================================================ */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  /* ============================================================
     🧾 LOAD COMPANIES (ADMIN OVERVIEW)
  ============================================================ */
  async function loadAdminCompanies() {
    if (!adminTable) return;
    adminTable.innerHTML =
      '<tr><td colspan="5" class="text-center p-4 text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(`${API_BASE}/admin/overview`);
      const data = await res.json();

      if (!res.ok || !data.companies) throw new Error("Ongeldig antwoord");

      const companies = data.companies;
      if (!companies.length) {
        adminTable.innerHTML =
          '<tr><td colspan="5" class="text-center p-4 text-gray-400">Geen bedrijven gevonden.</td></tr>';
        return;
      }

      adminTable.innerHTML = companies
        .map(
          (c) => `
        <tr class="border-b hover:bg-gray-50">
          <td class="p-3 font-medium">${esc(c.name)}</td>
          <td class="p-3">${esc(c.owner?.email || "-")}</td>
          <td class="p-3">
            ${
              c.isVerified
                ? '<span class="px-2 py-1 rounded text-xs bg-green-100 text-green-700">Geverifieerd</span>'
                : '<span class="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">Niet geverifieerd</span>'
            }
          </td>
          <td class="p-3 text-center">${c.reviewCount || 0}</td>
          <td class="p-3 flex gap-2">
            <a href="company.html?slug=${encodeURIComponent(
              c.slug
            )}" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
              🔍 Bekijken
            </a>
            <button class="verifyBtn text-green-600 text-sm" data-id="${c._id}">✔️ Verifiëren</button>
            <button class="deleteBtn text-red-600 text-sm" data-id="${c._id}">🗑️ Verwijderen</button>
          </td>
        </tr>`
        )
        .join("");

      document.querySelectorAll(".deleteBtn").forEach((btn) =>
        btn.addEventListener("click", () => doDeleteCompany(btn.dataset.id))
      );

      document.querySelectorAll(".verifyBtn").forEach((btn) =>
        btn.addEventListener("click", () => doVerifyCompany(btn.dataset.id))
      );
    } catch (err) {
      console.error("❌ fout:", err);
      adminTable.innerHTML =
        '<tr><td colspan="5" class="text-center p-4 text-red-600">❌ Fout bij laden.</td></tr>';
    }
  }

  async function doDeleteCompany(id) {
    if (!confirm("Weet je zeker dat je dit bedrijf wilt verwijderen?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/company/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Serverfout");

      showNotif("✅ Bedrijf verwijderd");
      await loadAdminCompanies();
    } catch (err) {
      console.error(err);
      showNotif("❌ Fout bij verwijderen", false);
    }
  }

  async function doVerifyCompany(id) {
    if (!confirm("Wil je de verificatiestatus wijzigen?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/verify/${id}`, {
        method: "PUT",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Serverfout");

      showNotif("✅ Verificatie gewijzigd");
      await loadAdminCompanies();
    } catch (err) {
      console.error(err);
      showNotif("❌ Fout bij verificatie", false);
    }
  }

  if (refreshCompaniesBtn) {
    refreshCompaniesBtn.addEventListener("click", loadAdminCompanies);
  }

  /* ============================================================
     ⭐ GEMELDE REVIEWS
  ============================================================ */
  const reportedTableBody = byId("reported-table-body");

  async function loadReportedReviews() {
    if (reportedTableBody)
      reportedTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center p-4 text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_REPORTED);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) throw new Error("ongeldig antwoord");

      renderReportedTable(data);
      updateReportedStats(data);
    } catch (err) {
      console.error("❌ fout reviews:", err);
      if (reportedTableBody)
        reportedTableBody.innerHTML =
          '<tr><td colspan="7" class="text-center p-4 text-red-600">❌ Fout bij laden.</td></tr>';
      updateReportedStats([]);
    }
  }

  function renderReportedTable(list) {
    if (!reportedTableBody) return;

    if (!list.length) {
      reportedTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center p-4 text-gray-400">Geen gemelde reviews.</td></tr>';
      return;
    }

    reportedTableBody.innerHTML = list
      .map((r) => {
        const id = r._id;
        const companyName = r.company?.name || "Onbekend";
        const reviewer = r.reviewerName || "Onbekend";
        const rating = r.rating ? "⭐".repeat(r.rating) : "-";
        const msg = esc(r.message || "");
        const d = formatDate(r.createdAt);
        const resolved = !r.reported;

        return `
        <tr class="border-b" data-id="${id}">
          <td class="p-3">${esc(companyName)}</td>
          <td class="p-3">${esc(reviewer)}</td>
          <td class="p-3">${rating}</td>
          <td class="p-3 max-w-xs truncate" title="${msg}">${msg}</td>
          <td class="p-3 whitespace-nowrap">${d}</td>
          <td class="p-3">
            <span class="px-2 py-1 rounded text-xs font-medium ${
              resolved
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }">${resolved ? "Afgehandeld" : "In behandeling"}</span>
          </td>
          <td class="p-3">
            ${
              resolved
                ? `<span class="text-xs text-gray-400">✔ Gereed</span>`
                : `<button class="mark-done bg-green-600 text-white px-2 py-1 rounded text-xs">Markeer als afgehandeld</button>`
            }
          </td>
        </tr>`;
      })
      .join("");

    reportedTableBody.querySelectorAll(".mark-done").forEach((btn) =>
      btn.addEventListener("click", () =>
        markReviewAsResolved(btn.closest("tr").dataset.id)
      )
    );
  }

  async function markReviewAsResolved(id) {
    if (!confirm("Weet je zeker dat je deze melding wilt afhandelen?")) return;

    try {
      const res = await fetch(ENDPOINT_RESOLVE_REPORTED(id), {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("Serverfout");

      showNotif("✅ Review afgehandeld");
      await loadReportedReviews();
    } catch (err) {
      console.error(err);
      showNotif("❌ Fout bij afhandelen review", false);
    }
  }

  function updateReportedStats(list) {
    const totalEl = byId("total-reported");
    const openEl = byId("open-reported");
    const resolvedEl = byId("resolved-reported");

    const total = list.length;
    const resolved = list.filter((r) => !r.reported).length;
    const open = total - resolved;

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (resolvedEl) resolvedEl.textContent = resolved;
  }

  if (refreshReviewsBtn) {
    refreshReviewsBtn.addEventListener("click", loadReportedReviews);
  }

  /* ============================================================
     CLAIMS
  ============================================================ */
  async function loadClaims() {
    if (!claimTable) return;
    claimTable.innerHTML =
      '<tr><td colspan="6" class="p-4 text-center text-gray-400">Laden...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const data = await res.json();

      if (!res.ok || !data.ok || !Array.isArray(data.items))
        throw new Error("ongeldig antwoord");

      const list = data.items;

      if (!list.length) {
        claimTable.innerHTML =
          '<tr><td colspan="6" class="p-4 text-center text-gray-400">Geen claimverzoeken.</td></tr>';
        return;
      }

      claimTable.innerHTML = list
        .map(
          (c) => `
          <tr class="border-b hover:bg-gray-50">
            <td class="p-3">${formatDate(c.createdAt)}</td>
            <td class="p-3">${esc(c.companyId?.name || "(onbekend)")}</td>
            <td class="p-3">${esc(c.contactName || "")}</td>
            <td class="p-3">${esc(c.contactEmail || "")}</td>
            <td class="p-3">${esc(c.contactPhone || "")}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded text-xs font-medium ${
                c.status === "verified"
                  ? "bg-green-100 text-green-700"
                  : c.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }">${esc(c.status)}</span>
            </td>
          </tr>`
        )
        .join("");
    } catch (err) {
      console.error("❌ fout claims:", err);
      claimTable.innerHTML =
        '<tr><td colspan="6" class="p-4 text-center text-red-600">❌ Fout bij laden.</td></tr>';
    }
  }

  /* ============================================================
     SERVERLOGS
  ============================================================ */
  async function loadServerLogs() {
    if (!logsContainer) return;
    logsContainer.textContent = "Logs worden geladen...";

    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();

      if (!res.ok || !Array.isArray(logs))
        throw new Error("Ongeldig antwoord");

      logsContainer.innerHTML = logs
        .slice(-30)
        .reverse()
        .map(
          (l) =>
            `<div class="mb-1"><span class="text-gray-500">${formatDate(
              l.timestamp || l.date
            )}:</span> ${esc(l.message || l)}</div>`
        )
        .join("");
    } catch (err) {
      console.error("❌ fout logs:", err);
      logsContainer.innerHTML =
        '<div class="text-red-600">❌ Kon serverlogs niet laden.</div>';
    }
  }

  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener("click", loadServerLogs);
  }

  /* ============================================================
     INITIELE LOADS
  ============================================================ */
  await Promise.all([
    loadAdminCompanies(),
    loadReportedReviews(),
    loadClaims(),
    loadServerLogs(),
  ]);

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
  return isNaN(d)
    ? "-"
    : d.toLocaleString("nl-NL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}
