(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  document.addEventListener("DOMContentLoaded", initDashboard);

  async function initDashboard() {
    console.log("📊 Dashboard gestart (v20251114-fixed)");

    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");
    let companyId = localStorage.getItem("companyId");

    const $reqBody = byId("request-table-body");
    const $revBody = byId("review-table-body");

    /* ============================================================
       1. ADMIN CHECK
    ============================================================ */
    const isAdmin =
      role === "admin" ||
      (email && email.toLowerCase() === "info@irisje.nl");

    if (isAdmin) {
      console.log("🛠️ Admin → redirect");
      showAdminRedirectNotice();
      setTimeout(() => (window.location.href = "admin.html"), 800);
      return;
    }

    /* ============================================================
       2. COMPANY VALIDATIE
    ============================================================ */
    if (!companyId) {
      console.warn("❌ Geen companyId opgeslagen");
      if ($reqBody)
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4'>Geen bedrijf gevonden</td></tr>";
      if ($revBody)
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4'>Geen bedrijf gevonden</td></tr>";
      return;
    }

    /* ============================================================
       3. LOAD COMPANY PROFILE (⚠️ FIXED — NIET MEER SLUG!)
    ============================================================ */
    async function loadCompanyProfile() {
      try {
        const companyRes = await fetch(`${API_BASE}/companies/${companyId}`);
        if (!companyRes.ok) throw new Error("Bedrijf niet gevonden");

        const company = await companyRes.json();

        // Lists ophalen
        const listRes = await fetch(`${API_BASE}/companies/lists`);
        const lists = await listRes.json();

        fillCompanyForm(company);
        renderSelectOptions(byId("companySpecialties"), lists.specialties, company.specialties);
        renderSelectOptions(byId("companyCertifications"), lists.certifications, company.certifications);
        renderSelectOptions(byId("companyLanguages"), lists.languages, company.languages);

      } catch (err) {
        console.error("❌ Fout bij laden bedrijfsprofiel:", err);
        showNotif("Kon bedrijfsprofiel niet laden", false);
      }
    }

    function fillCompanyForm(c) {
      const form = byId("companyForm");
      if (!form) return;

      form.companyName.value = c.name || "";
      form.companyCity.value = c.city || "";
      form.companyPhone.value = c.phone || "";
      form.companyWebsite.value = c.website || "";
      form.companyAvailability.value = c.availability || "";
      form.companyRegions.value = Array.isArray(c.regions)
        ? c.regions.join(", ")
        : "";
      form.companyWorksNationwide.checked = !!c.worksNationwide;
    }

    function renderSelectOptions(select, options = [], selected = []) {
      if (!select) return;
      select.innerHTML = options
        .map(
          (opt) =>
            `<option value="${opt}" ${
              selected?.includes(opt) ? "selected" : ""
            }>${opt}</option>`
        )
        .join("");
    }

    await loadCompanyProfile();

    /* ============================================================
       4. LOAD REQUESTS
    ============================================================ */
    let allRequests = [];

    async function loadRequests() {
      try {
        const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
        const data = await res.json();

        allRequests = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];

        renderRequestTable();
      } catch (err) {
        console.error("❌ Fout bij aanvragen:", err);
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4 text-red-600'>Fout bij laden aanvragen.</td></tr>";
      }
    }

    function renderRequestTable() {
      if (!$reqBody) return;

      if (!allRequests.length) {
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4 text-gray-500'>Geen aanvragen gevonden.</td></tr>";
        updateCharts();
        return;
      }

      const options = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];

      $reqBody.innerHTML = allRequests
        .map((r) => {
          const d = new Date(r.createdAt);
          const date = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");

          return `
            <tr class="border-b hover:bg-gray-50">
              <td class="p-3">${esc(r.name)}</td>
              <td class="p-3">${esc(r.email)}</td>
              <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
              <td class="p-3">
                <select data-id="${r._id}" class="statusSelect border rounded px-2 py-1 text-sm">
                  ${options.map((o) => `<option value="${o}" ${o === r.status ? "selected" : ""}>${o}</option>`).join("")}
                </select>
              </td>
              <td class="p-3">${date}</td>
            </tr>
          `;
        })
        .join("");

      document.querySelectorAll(".statusSelect").forEach((sel) =>
        sel.addEventListener("change", async (e) => {
          const id = e.target.dataset.id;
          const status = e.target.value;

          try {
            const res = await fetch(`${API_BASE}/dashboard/status/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });

            if (!res.ok) throw new Error();

            const idx = allRequests.findIndex((r) => r._id === id);
            if (idx >= 0) allRequests[idx].status = status;

            updateCharts();
            showNotif("Status opgeslagen");

          } catch (err) {
            showNotif("Fout bij statusupdate", false);
          }
        })
      );

      updateCharts();
    }

    /* ============================================================
       5. LOAD REVIEWS
    ============================================================ */
    let allReviews = [];

    async function loadReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
        const data = await res.json();

        allReviews = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];

        renderReviewsTable();
      } catch (err) {
        console.error("❌ Fout bij reviews:", err);
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4 text-red-600'>Fout bij laden reviews.</td></tr>";
      }
    }

    function renderReviewsTable() {
      if (!$revBody) return;

      if (!allReviews.length) {
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4 text-gray-500'>Nog geen reviews.</td></tr>";
        return;
      }

      $revBody.innerHTML = allReviews
        .map((r) => {
          const d = new Date(r.createdAt);
          const date = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");

          return `
            <tr class="border-b hover:bg-gray-50">
              <td class="p-3">${esc(r.reviewerName || "Onbekend")}</td>
              <td class="p-3">${r.rating ? "⭐".repeat(r.rating) : "-"}</td>
              <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
              <td class="p-3">${date}</td>
              <td class="p-3">
                ${r.reported
                  ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
                  : `<button onclick="meldReview('${r._id}')" class="bg-red-600 text-white px-2 py-1 rounded text-xs">Melden</button>`
                }
              </td>
            </tr>
          `;
        })
        .join("");
    }

    await Promise.all([loadRequests(), loadReviews()]);

    /* ============================================================
       6. CHARTS
    ============================================================ */
    let statusChart;

    function updateCharts() {
      const total = allRequests.length;
      const accepted = allRequests.filter((r) => r.status === "Geaccepteerd").length;
      const rejected = allRequests.filter((r) => r.status === "Afgewezen").length;
      const followed = allRequests.filter((r) => r.status === "Opgevolgd").length;

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
  }

  /* UTIL */
  const byId = (id) => document.getElementById(id);
  const setText = (id, val) => {
    const el = byId(id);
    if (el) el.textContent = val;
  };
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );

  function showAdminRedirectNotice() {
    const div = document.createElement("div");
    div.className =
      "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-4 rounded shadow text-sm";
    div.textContent = "Beheerdersdashboard wordt geopend...";
    document.body.appendChild(div);
  }

  function showNotif(msg, success = true) {
    console.log(msg);
  }
})();
