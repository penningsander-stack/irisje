// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/claims/all`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251114-FIXED)");

  const logoutBtn = document.getElementById("logoutBtn");
  const refreshReviewsBtn = document.getElementById("refreshBtn");
  const refreshLogsBtn = document.getElementById("refreshLogsBtn");
  const logsContainer = document.getElementById("logs-container");
  const adminTable = document.getElementById("adminCompanyTable");
  const refreshCompaniesBtn = document.getElementById("refreshCompanies");
  const claimTable = document.getElementById("claimTableBody");

  // 🔔 Notificatie
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
    notif.style.transition = "opacity 0.3s ease";
    setTimeout(() => (notif.style.opacity = "1"), 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  /* ============================================================
     🔹 Sidebar navigatie
  ============================================================ */
  const nav = document.getElementById("adminNav");
  if (nav) {
    nav.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.section;

        nav.querySelectorAll(".nav-item").forEach((b) => {
          b.classList.remove("bg-indigo-50", "text-indigo-700");
          b.classList.add("text-gray-700");
        });
        btn.classList.add("bg-indigo-50", "text-indigo-700");

        document
          .querySelectorAll("main section[id^='section-']")
          .forEach((sec) => sec.classList.add("hidden"));
        const active = document.getElementById(target);
        if (active) active.classList.remove("hidden");
      });
    });
  }

  /* ============================================================
     🔹 Logout
  ============================================================ */
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  /* ============================================================
     ⭐ CLAIMVERZOEKEN — FIXED
  ============================================================ */
  async function loadClaims() {
    if (!claimTable) return;
    claimTable.innerHTML =
      '<tr><td colspan="6" class="text-gray-400 text-center p-4">Claimverzoeken worden geladen...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const data = await res.json();

      // ✔️ FIX 1: juiste validatie
      if (!res.ok || !data.ok || !Array.isArray(data.items)) {
        throw new Error("Ongeldig antwoord");
      }

      const list = data.items;

      if (!list.length) {
        claimTable.innerHTML =
          '<tr><td colspan="6" class="text-gray-400 text-center p-4">Geen claimverzoeken gevonden.</td></tr>';
        return;
      }

      claimTable.innerHTML = list
        .map((c) => {
          const d = formatDate(c.createdAt);
          return `
            <tr class="border-b hover:bg-gray-50">
              <td class="p-3">${d}</td>
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
                }">${esc(c.status || "pending")}</span>
              </td>
            </tr>`;
        })
        .join("");
    } catch (err) {
      console.error("❌ Fout bij laden claimverzoeken:", err);
      claimTable.innerHTML =
        '<tr><td colspan="6" class="text-red-600 text-center p-4">❌ Kon claimverzoeken niet laden.</td></tr>';
    }
  }
  /* ============================================================
     🧩 SERVERLOGS
  ============================================================ */
  async function loadServerLogs() {
    const logsContainer = document.getElementById("logs-container");
    if (!logsContainer) return;
    logsContainer.textContent = "Logs worden geladen...";

    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();

      if (!res.ok || !Array.isArray(logs))
        throw new Error("Ongeldig logantwoord");

      const recentLogs = logs.slice(-30).reverse();
      logsContainer.innerHTML = recentLogs
        .map(
          (l) =>
            `<div class="mb-1"><span class="text-gray-500">${formatDate(
              l.timestamp || l.date
            )}:</span> ${esc(l.message || l)}</div>`
        )
        .join("");

      if (!recentLogs.length) {
        logsContainer.innerHTML =
          '<div class="text-gray-400">Geen logs gevonden.</div>';
      }
    } catch (err) {
      console.error("Fout bij laden logs:", err);
      logsContainer.innerHTML =
        '<div class="text-red-600">❌ Kon serverlogs niet laden.</div>';
    }
  }

  if (refreshLogsBtn) {
    refreshLogsBtn.addEventListener("click", loadServerLogs);
  }

  /* ----------------------------------------------------------- */

  // === INITIELE LOADS ===
  await Promise.all([
    loadAdminCompanies(),
    loadReportedReviews(),
    loadClaims(), // ✔️ FIX zit hierboven
    loadServerLogs(),
  ]);

  setInterval(loadServerLogs, 30000);
}

/* ============================================================
   HELPERFUNCTIES
============================================================ */
function esc(v) {
  return v == null
    ? ""
    : String(v).replace(/[&<>"']/g, (s) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
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

function renderCompanyDropdown(items, listEl, hiddenInput, labelEl) {
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!items.length) {
    listEl.innerHTML =
      '<div class="px-3 py-2 text-sm text-gray-400">Geen bedrijven gevonden.</div>';
    return;
  }

  items.forEach((c) => {
    const div = document.createElement("div");
    div.className = "dropdown-item";
    div.textContent = c.name;
    div.addEventListener("click", () => {
      if (hiddenInput) hiddenInput.value = c._id;
      if (labelEl) labelEl.textContent = `Geselecteerd: ${c.name}`;
    });
    listEl.appendChild(div);
  });
}
