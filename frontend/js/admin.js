// ============================================================
// frontend/js/admin.js  –  VERSIE 2025-11-13 (STABIEL)
// ============================================================

const API_BASE = "https://irisje-backend.onrender.com/api";

const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/claims/all`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251113)");

  // ------------------------------------------------------------
  // ELEMENTS
  // ------------------------------------------------------------
  const tableBody = document.getElementById("reported-table-body");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const logsContainer = document.getElementById("logs-container");
  const refreshLogsBtn = document.getElementById("refreshLogsBtn");
  const claimTable = document.getElementById("claimTableBody");

  // ------------------------------------------------------------
  // 🔔 NOTIFICATIEBALK
  // ------------------------------------------------------------
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  document.body.appendChild(notif);

  function showNotif(msg = "Gereed", ok = true) {
    notif.textContent = msg;
    notif.classList.remove("hidden");
    notif.classList.toggle("bg-green-600", ok);
    notif.classList.toggle("bg-red-600", !ok);
    notif.style.opacity = "0";
    notif.style.transition = "opacity .25s ease";
    requestAnimationFrame(() => (notif.style.opacity = "1"));

    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 250);
    }, 2300);
  }

  // ------------------------------------------------------------
  // LOGOUT BUTTON
  // ------------------------------------------------------------
  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ------------------------------------------------------------
  // BUTTONS
  // ------------------------------------------------------------
  refreshBtn?.addEventListener("click", loadReportedReviews);
  refreshLogsBtn?.addEventListener("click", loadServerLogs);

  // ------------------------------------------------------------
  // INITIAL LOAD
  // ------------------------------------------------------------
  await loadReportedReviews();
  await loadClaims();
  await loadServerLogs();

  setInterval(loadServerLogs, 30000);

  // ============================================================
  // GEMELDE REVIEWS LADEN
  // ============================================================
  async function loadReportedReviews() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-gray-400 p-4">
          Gemelde reviews worden geladen...
        </td></tr>`;
    }

    try {
      const res = await fetch(ENDPOINT_GET_REPORTED);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord");

      renderReportedTable(data);
      updateReportedStats(data);
    } catch (err) {
      console.error("Fout bij laden gemelde reviews:", err);
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-red-600 p-4">
          ❌ Kon gemelde reviews niet laden.
        </td></tr>`;
      updateReportedStats([]);
    }
  }

  // ------------------------------------------------------------
  // RENDER GEMELDE REVIEWS
  // ------------------------------------------------------------
  function renderReportedTable(list) {
    if (!tableBody) return;

    if (!list.length) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center text-gray-400 p-4">
          Geen gemelde reviews gevonden.
        </td></tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map((r) => {
        const id = r._id;
        const companyName = esc(r.company?.name || r.companyName || "Onbekend");
        const reviewer = esc(r.reviewerName || r.name || "Onbekend");
        const rating = r.rating ? "⭐".repeat(r.rating) : "-";
        const msg = esc(r.message || "");
        const d = formatDate(r.createdAt);
        const resolved = !r.reported;

        return `
          <tr class="border-b border-gray-50 hover:bg-gray-50" data-id="${id}">
            <td class="p-3">${companyName}</td>
            <td class="p-3">${reviewer}</td>
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
                  : `<button class="mark-done bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
                      data-id="${id}">Markeer als afgehandeld</button>`
              }
            </td>
          </tr>`;
      })
      .join("");

    // events
    tableBody.querySelectorAll(".mark-done").forEach((btn) => {
      btn.addEventListener("click", () => markAsResolved(btn.dataset.id));
    });
  }

  // ------------------------------------------------------------
  // REVIEW AFHANDELEN
  // ------------------------------------------------------------
  async function markAsResolved(id) {
    if (!confirm("Weet je zeker dat je deze melding wilt afhandelen?")) return;

    try {
      const res = await fetch(ENDPOINT_RESOLVE_REPORTED(id), { method: "PATCH" });
      if (!res.ok) throw new Error("Serverfout");

      showNotif("Review afgehandeld");
      loadReportedReviews();
    } catch (err) {
      console.error(err);
      showNotif("❌ Fout bij afhandelen", false);
    }
  }

  // ------------------------------------------------------------
  // STATISTIEKEN GEMELDE REVIEWS
  // ------------------------------------------------------------
  function updateReportedStats(list) {
    const totalEl = document.getElementById("total-reported");
    const openEl = document.getElementById("open-reported");
    const resolvedEl = document.getElementById("resolved-reported");

    const total = list.length;
    const resolved = list.filter((r) => !r.reported).length;
    const open = total - resolved;

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (resolvedEl) resolvedEl.textContent = resolved;
  }

  // ============================================================
  // CLAIMS LADEN
  // ============================================================
  async function loadClaims() {
    if (!claimTable) return;

    claimTable.innerHTML = `
      <tr><td colspan="6" class="text-gray-400 text-center p-4">Claimverzoeken worden geladen...</td></tr>
    `;

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord");

      if (!data.length) {
        claimTable.innerHTML = `
          <tr><td colspan="6" class="text-gray-400 text-center p-4">Geen claimverzoeken gevonden.</td></tr>`;
        return;
      }

      claimTable.innerHTML = data
        .map((c) => {
          return `
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
                }">${c.status}</span>
              </td>
            </tr>`;
        })
        .join("");
    } catch (err) {
      console.error("Fout bij laden claimverzoeken:", err);
      claimTable.innerHTML = `
        <tr><td colspan="6" class="text-red-600 text-center p-4">❌ Kon claimverzoeken niet laden.</td></tr>`;
    }
  }

  // ============================================================
  // SERVERLOGS LADEN
  // ============================================================
  async function loadServerLogs() {
    if (!logsContainer) return;
    logsContainer.textContent = "Logs worden geladen...";

    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();

      if (!res.ok || !Array.isArray(logs)) throw new Error("Ongeldig logantwoord");

      const recent = logs.slice(-30).reverse();

      logsContainer.innerHTML = recent
        .map(
          (l) =>
            `<div class="mb-1"><span class="text-gray-500">${formatDate(
              l.timestamp || l.date
            )}:</span> ${esc(l.message || l)}</div>`
        )
        .join("");

      if (!recent.length)
        logsContainer.innerHTML = `<div class="text-gray-400">Geen logs gevonden.</div>`;
    } catch (err) {
      console.error("Fout bij ophalen logs:", err);
      logsContainer.innerHTML = `<div class="text-red-600">❌ Kon serverlogs niet laden.</div>`;
    }
  }
}

// ============================================================
// HELPERS
// ============================================================
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
