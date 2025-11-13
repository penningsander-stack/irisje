// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;
const ENDPOINT_GET_LOGS = `${API_BASE}/admin/logs`;
const ENDPOINT_GET_CLAIMS = `${API_BASE}/claims/all`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  console.log("🛠️ Admin-dashboard geladen (v20251113)");

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
     🧪 SYSTEEMTEST – E-MAIL
  ============================================================ */
  const loadCompaniesBtn = document.getElementById("loadCompaniesBtn");
  const companyDropdown = document.getElementById("companyDropdownContainer");
  const companyList = document.getElementById("companyList");
  const searchCompanyInput = document.getElementById("searchCompany");
  const selectedCompanyIdInput = document.getElementById("selectedCompanyId");
  const selectedCompanyName = document.getElementById("selectedCompanyName");
  const openConfirmBtn = document.getElementById("openConfirmBtn");
  const testResult = document.getElementById("testResult");
  const testNameInput = document.getElementById("testName");
  const testEmailInput = document.getElementById("testEmail");
  const testMessageInput = document.getElementById("testMessage");

  const modal = document.getElementById("confirmModal");
  const modalMsg = document.getElementById("modalMessage");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const confirmMsg = document.getElementById("confirmMsg");

  let allCompanies = [];

  if (loadCompaniesBtn) {
    loadCompaniesBtn.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = "⏳ Laden...";
      try {
        const res = await fetch(`${API_BASE}/companies`);
        const data = await res.json();
        allCompanies = data.items || [];
        if (!allCompanies.length) {
          btn.textContent = "Geen bedrijven gevonden";
          return;
        }
        if (companyDropdown) companyDropdown.classList.remove("hidden");
        renderCompanyDropdown(allCompanies, companyList, selectedCompanyIdInput, selectedCompanyName);
        btn.textContent = "✅ Bedrijven geladen";
      } catch (err) {
        console.error("Fout bij laden bedrijven:", err);
        btn.textContent = "⚠️ Fout bij laden";
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (searchCompanyInput) {
    searchCompanyInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allCompanies.filter((c) =>
        (c.name || "").toLowerCase().includes(term)
      );
      renderCompanyDropdown(filtered, companyList, selectedCompanyIdInput, selectedCompanyName);
    });
  }

  if (openConfirmBtn) {
    openConfirmBtn.addEventListener("click", () => {
      if (!selectedCompanyIdInput.value) {
        if (testResult) testResult.textContent = "⚠️ Kies eerst een bedrijf.";
        return;
      }
      if (!modal) return;
      modalMsg.textContent = "Een testmail wordt verzonden naar het gekozen bedrijf.";
      modal.dataset.action = "sendTest";
      modal.classList.remove("hidden");
    });
  }

  if (confirmNo && modal) {
    confirmNo.addEventListener("click", () => modal.classList.add("hidden"));
  }

  if (confirmYes && modal) {
    confirmYes.addEventListener("click", async () => {
      if (!modal.dataset.action) return;
      confirmMsg.classList.add("hidden");

      if (modal.dataset.action === "sendTest") {
        if (testResult) testResult.textContent = "⏳ Bezig met verzenden...";
        const payload = {
          customerName: testNameInput.value.trim(),
          customerEmail: testEmailInput.value.trim(),
          message: testMessageInput.value.trim(),
          companies: [selectedCompanyIdInput.value.trim()],
        };
        try {
          const res = await fetch(`${API_BASE}/publicRequests/multi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (res.ok) {
            testResult.textContent = `✅ Succesvol verzonden:\n${JSON.stringify(
              data,
              null,
              2
            )}`;
            confirmMsg.textContent = "✅ Testmail verzonden";
            confirmMsg.classList.remove("hidden");
            setTimeout(() => modal.classList.add("hidden"), 1200);
          } else {
            testResult.textContent = `⚠️ Fout (${res.status}): ${data.error || JSON.stringify(data)}`;
          }
        } catch (err) {
          console.error("Fout bij testmail:", err);
          testResult.textContent = `❌ Netwerkfout: ${err.message}`;
        }
      } else if (modal.dataset.action === "deleteCompany") {
        await deleteCompany(modal.dataset.id);
      } else if (modal.dataset.action === "verifyCompany") {
        await toggleVerify(modal.dataset.id);
      }
    });
  }

  /* ============================================================
     🏢 BEDRIJVENBEHEER
  ============================================================ */
  async function loadAdminCompanies() {
    if (!adminTable) return;
    adminTable.innerHTML =
      '<tr><td colspan="5" class="text-center text-gray-400 p-4">Laden...</td></tr>';

    try {
      const res = await fetch(`${API_BASE}/admin/overview`);
      const data = await res.json();
      const companies = data.companies || [];
      if (!companies.length) {
        adminTable.innerHTML =
          '<tr><td colspan="5" class="text-center text-gray-400 p-4">Geen bedrijven gevonden.</td></tr>';
        return;
      }

      adminTable.innerHTML = companies
        .map(
          (c) => `
          <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
            <td class="p-3 font-medium">${esc(c.name)}</td>
            <td class="p-3">${esc(c.owner?.email || "-")}</td>
            <td class="p-3">
              ${
                c.isVerified
                  ? '<span class="text-green-700 bg-green-100 px-2 py-1 rounded text-xs font-medium">Geverifieerd</span>'
                  : '<span class="text-gray-700 bg-gray-100 px-2 py-1 rounded text-xs font-medium">Niet geverifieerd</span>'
              }
            </td>
            <td class="p-3 text-center">${c.reviewCount || 0}</td>
            <td class="p-3 flex gap-2">
              <a href="company.html?slug=${encodeURIComponent(
                c.slug
              )}" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-sm">
                🔍 Bekijken
              </a>
              <button data-id="${c._id}" class="verifyBtn text-sm text-green-600 hover:text-green-800">
                ✔️ Verifiëren
              </button>
              <button data-id="${c._id}" class="deleteBtn text-sm text-red-600 hover:text-red-800">
                🗑️ Verwijderen
              </button>
            </td>
          </tr>`
        )
        .join("");

      document.querySelectorAll(".deleteBtn").forEach((btn) =>
        btn.addEventListener("click", () => {
          if (!modal) return;
          modalMsg.textContent = "Weet je zeker dat je dit bedrijf wilt verwijderen?";
          modal.dataset.action = "deleteCompany";
          modal.dataset.id = btn.dataset.id;
          modal.classList.remove("hidden");
        })
      );

      document.querySelectorAll(".verifyBtn").forEach((btn) =>
        btn.addEventListener("click", () => {
          if (!modal) return;
          modalMsg.textContent = "Wil je de verificatiestatus van dit bedrijf wijzigen?";
          modal.dataset.action = "verifyCompany";
          modal.dataset.id = btn.dataset.id;
          modal.classList.remove("hidden");
        })
      );
    } catch (err) {
      console.error("Fout bij laden bedrijven:", err);
      adminTable.innerHTML =
        '<tr><td colspan="5" class="text-center text-red-600 p-4">❌ Fout bij laden bedrijven.</td></tr>';
    }
  }

  async function deleteCompany(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/company/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Serverfout");
      confirmMsg.textContent = "✅ Bedrijf verwijderd";
      confirmMsg.classList.remove("hidden");
      showNotif("✅ Bedrijf verwijderd");
      await loadAdminCompanies();
    } catch (err) {
      console.error("Fout bij verwijderen bedrijf:", err);
      alert("Fout: " + err.message);
      showNotif("❌ Fout bij verwijderen bedrijf", false);
    } finally {
      setTimeout(() => modal.classList.add("hidden"), 1200);
    }
  }

  async function toggleVerify(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/verify/${id}`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Serverfout");
      confirmMsg.textContent = "✅ Verificatie gewijzigd";
      confirmMsg.classList.remove("hidden");
      showNotif("✅ Verificatiestatus gewijzigd");
      await loadAdminCompanies();
    } catch (err) {
      console.error("Fout bij verificatie:", err);
      alert("Fout: " + err.message);
      showNotif("❌ Fout bij verificatie", false);
    } finally {
      setTimeout(() => modal.classList.add("hidden"), 1200);
    }
  }

  if (refreshCompaniesBtn) {
    refreshCompaniesBtn.addEventListener("click", loadAdminCompanies);
  }

  /* ============================================================
     ⭐ GEMELDE REVIEWS
  ============================================================ */
  const reportedTableBody = document.getElementById("reported-table-body");

  async function loadReportedReviews() {
    if (reportedTableBody) {
      reportedTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Gemelde reviews worden geladen...
          </td>
        </tr>`;
    }

    try {
      const res = await fetch(ENDPOINT_GET_REPORTED);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord");
      renderReportedTable(data);
      updateReportedStats(data);
    } catch (err) {
      console.error("Fout bij laden gemelde reviews:", err);
      if (reportedTableBody) {
        reportedTableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-red-600 p-4">
              ❌ Kon gemelde reviews niet laden.
            </td>
          </tr>`;
      }
      updateReportedStats([]);
    }
  }

  function renderReportedTable(list) {
    if (!reportedTableBody) return;
    if (!list.length) {
      reportedTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Geen gemelde reviews gevonden.
          </td>
        </tr>`;
      return;
    }

    reportedTableBody.innerHTML = list
      .map((r) => {
        const id = r._id || r.id;
        const companyName = r.company?.name || r.companyName || "Onbekend";
        const reviewer = r.reviewerName || r.name || "Onbekend";
        const rating = r.rating ? "⭐".repeat(r.rating) : "-";
        const msg = esc(r.message || "");
        const d = formatDate(r.createdAt || r.date);
        const resolved = !r.reported;

        return `
        <tr class="border-b border-gray-50 hover:bg-gray-50" data-id="${id}">
          <td class="p-3">${esc(companyName)}</td>
          <td class="p-3">${esc(reviewer)}</td>
          <td class="p-3">${rating}</td>
          <td class="p-3 max-w-xs truncate" title="${msg}">${msg}</td>
          <td class="p-3 whitespace-nowrap">${d}</td>
          <td class="p-3">
            <span class="px-2 py-1 rounded text-xs font-medium ${
              resolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }">${resolved ? "Afgehandeld" : "In behandeling"}</span>
          </td>
          <td class="p-3">
            ${
              resolved
                ? `<span class="text-xs text-gray-400">✔ Gereed</span>`
                : `<button class="mark-done bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition" data-id="${id}">
                    Markeer als afgehandeld
                  </button>`
            }
          </td>
        </tr>`;
      })
      .join("");

    reportedTableBody.querySelectorAll(".mark-done").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        await markReviewAsResolved(id);
      });
    });
  }

  async function markReviewAsResolved(id) {
    if (!confirm("Weet je zeker dat je deze melding wilt afhandelen?")) return;
    try {
      const res = await fetch(ENDPOINT_RESOLVE_REPORTED(id), { method: "PATCH" });
      if (!res.ok) throw new Error("Serverfout");

      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        row.style.opacity = "0.4";
        setTimeout(async () => {
          await loadReportedReviews();
          showNotif("✅ Review afgehandeld");
        }, 300);
      } else {
        await loadReportedReviews();
        showNotif("✅ Review afgehandeld");
      }
    } catch (err) {
      console.error("Fout bij afhandelen review:", err);
      alert("❌ Er ging iets mis bij het afhandelen van deze review.");
      showNotif("❌ Fout bij afhandelen review", false);
    }
  }

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

  if (refreshReviewsBtn) {
    refreshReviewsBtn.addEventListener("click", loadReportedReviews);
  }

  /* ============================================================
     🧾 CLAIMVERZOEKEN
  ============================================================ */
  async function loadClaims() {
    if (!claimTable) return;
    claimTable.innerHTML =
      '<tr><td colspan="6" class="text-gray-400 text-center p-4">Claimverzoeken worden geladen...</td></tr>';

    try {
      const res = await fetch(ENDPOINT_GET_CLAIMS);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord");

      if (!data.length) {
        claimTable.innerHTML =
          '<tr><td colspan="6" class="text-gray-400 text-center p-4">Geen claimverzoeken gevonden.</td></tr>';
        return;
      }

      claimTable.innerHTML = data
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
      console.error("Fout bij laden claimverzoeken:", err);
      claimTable.innerHTML =
        '<tr><td colspan="6" class="text-red-600 text-center p-4">❌ Kon claimverzoeken niet laden.</td></tr>';
    }
  }

  /* ============================================================
     🧩 SERVERLOGS
  ============================================================ */
  async function loadServerLogs() {
    if (!logsContainer) return;
    logsContainer.textContent = "Logs worden geladen...";

    try {
      const res = await fetch(ENDPOINT_GET_LOGS);
      const logs = await res.json();

      if (!res.ok || !Array.isArray(logs)) throw new Error("Ongeldig logantwoord");

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

  // === INITIELE LOADS ===
  await Promise.all([
    loadAdminCompanies(),
    loadReportedReviews(),
    loadClaims(),
    loadServerLogs(),
  ]);

  // Logs automatisch verversen
  setInterval(loadServerLogs, 30000);
}

/* ============================================================
   🔧 HELPERFUNCTIES
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
