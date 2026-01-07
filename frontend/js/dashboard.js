// frontend/js/dashboard.js
// v20260108-JWT-SAFE-DASHBOARD-B1-FINAL

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  /* ============================================================
     0. SUPER-VROEGE CHECK — voorkomt flicker
  ============================================================ */
  const earlyToken = localStorage.getItem("token");
  const earlyEmail = localStorage.getItem("userEmail");
  const earlyRole = localStorage.getItem("userRole");

  if (!earlyToken) {
    window.location.href = "login.html";
    return;
  }

  const earlyIsAdmin =
    earlyRole === "admin" ||
    (earlyEmail &&
      ["admin@irisje.nl", "info@irisje.nl"].includes(
        earlyEmail.toLowerCase()
      ));

  if (earlyIsAdmin) {
    window.location.href = "admin.html";
    return;
  }

  document.addEventListener("DOMContentLoaded", initDashboard);

  async function initDashboard() {
    console.log("📊 Dashboard gestart (v20260108-B1)");

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const $reqBody = byId("request-table-body");
    const $revBody = byId("review-table-body");

    /* ============================================================
       1. Charts — vóór gebruik initialiseren
    ============================================================ */
    let allRequests = [];
    let statusChart;

    function updateCharts() {
      const total = allRequests.length;
      const accepted = allRequests.filter(r => r.status === "Geaccepteerd").length;
      const rejected = allRequests.filter(r => r.status === "Afgewezen").length;
      const followed = allRequests.filter(r => r.status === "Opgevolgd").length;

      setText("total", total);
      setText("accepted", accepted);
      setText("rejected", rejected);
      setText("followed-up", followed);

      const ctx = byId("statusChart");
      if (!ctx || typeof Chart === "undefined") return;

      const data = {
        Nieuw: total - accepted - rejected - followed,
        Geaccepteerd: accepted,
        Afgewezen: rejected,
        Opgevolgd: followed,
      };

      if (statusChart) statusChart.destroy();

      statusChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(data),
          datasets: [{ data: Object.values(data) }],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });
    }

    /* ============================================================
       2. B1 — verplichte company onboarding
    ============================================================ */
    async function ensureCompanyId() {
      let companyId = localStorage.getItem("companyId");
      if (companyId) return companyId;

      const res = await authFetch(`${API_BASE}/companies/my`);
      const companies = res?.companies;

      if (Array.isArray(companies) && companies.length > 0) {
        companyId = companies[0]._id;
        localStorage.setItem("companyId", companyId);
        console.log("✅ Default company ingesteld:", companyId);
        return companyId;
      }

      // 🔴 B1: geen bedrijf → verplicht registreren
      console.warn("➡️ Geen bedrijf, door naar registratie");
      window.location.href = "register-company.html";
      throw new Error("Geen bedrijf gekoppeld");
    }

    const companyId = await ensureCompanyId();

    /* ============================================================
       3. Company profile
    ============================================================ */
    async function loadCompanyProfile() {
      const res = await authFetch(`${API_BASE}/companies/${companyId}`);
      const company = res?.item || res;
      if (!company) throw new Error("Bedrijf niet gevonden");

      fillCompanyForm(company);
    }

    function fillCompanyForm(c) {
      const form = byId("companyForm");
      if (!form) return;

      form.companyName.value = c.name || "";
      form.companyCity.value = c.city || "";
      form.companyPhone.value = c.phone || "";
      form.companyWebsite.value = c.website || "";
      form.companyAvailability.value = c.availability || "";
      form.companyRegions.value = Array.isArray(c.regions) ? c.regions.join(", ") : "";
      form.companyWorksNationwide.checked = !!c.worksNationwide;
    }

    await loadCompanyProfile();

    /* ============================================================
       4. Aanvragen
    ============================================================ */
    async function loadRequests() {
      const data = await authFetch(`${API_BASE}/requests/company/${companyId}`);
      const list = Array.isArray(data) ? data : data?.requests;

      allRequests = Array.isArray(list)
        ? list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];

      renderRequestTable();
    }

    function renderRequestTable() {
      if (!$reqBody) return;

      if (!allRequests.length) {
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4 text-gray-500'>Geen aanvragen.</td></tr>";
        updateCharts();
        return;
      }

      const options = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];

      $reqBody.innerHTML = allRequests.map(r => {
        const date = new Date(r.createdAt).toLocaleDateString("nl-NL");
        return `
          <tr>
            <td>${esc(r.name)}</td>
            <td>${esc(r.email)}</td>
            <td title="${esc(r.message)}">${esc(r.message)}</td>
            <td>
              <select data-id="${r._id}" class="statusSelect">
                ${options.map(o =>
                  `<option ${o === r.status ? "selected" : ""}>${o}</option>`
                ).join("")}
              </select>
            </td>
            <td>${date}</td>
          </tr>
        `;
      }).join("");

      document.querySelectorAll(".statusSelect").forEach(sel =>
        sel.addEventListener("change", async e => {
          const id = e.target.dataset.id;
          const status = e.target.value;
          await authFetch(`${API_BASE}/dashboard/status/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          const r = allRequests.find(x => x._id === id);
          if (r) r.status = status;
          updateCharts();
        })
      );

      updateCharts();
    }

    await loadRequests();
  }

  /* ============================================================
     UTIL
  ============================================================ */
  const byId = (id) => document.getElementById(id);
  const setText = (id, val) => {
    const el = byId(id);
    if (el) el.textContent = val;
  };
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, s =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );

  async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) location.href = "login.html";

    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      location.href = "login.html";
      return;
    }

    const data = res.headers.get("content-type")?.includes("json")
      ? await res.json()
      : null;

    if (!res.ok) throw new Error(data?.error || "Serverfout");
    return data;
  }
})();
