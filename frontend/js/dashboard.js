// frontend/js/dashboard.js
// v20260107-JWT-SAFE-DASHBOARD-DEFAULT-COMPANY-FIX

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  /* ============================================================
     0. SUPER-VROEGE CHECK — voorkomt flicker!
  ============================================================ */
  const earlyToken = localStorage.getItem("token");
  const earlyEmail = localStorage.getItem("userEmail");
  const earlyRole = localStorage.getItem("userRole");

  // Geen token? Dan hoor je hier überhaupt niet te zijn
  if (!earlyToken) {
    window.location.href = "login.html";
    return;
  }

  const earlyIsAdmin =
    earlyRole === "admin" ||
    (earlyEmail &&
      (earlyEmail.toLowerCase() === "admin@irisje.nl" ||
        earlyEmail.toLowerCase() === "info@irisje.nl"));

  // 🚀 Admin? DIRECT redirect, nog vóór DOM geladen is
  if (earlyIsAdmin) {
    window.location.href = "admin.html";
    return;
  }

  /* ============================================================
     Hoofd-initialisatie
  ============================================================ */
  document.addEventListener("DOMContentLoaded", initDashboard);

  async function initDashboard() {
    console.log("📊 Dashboard gestart (v20251118-JWT-SAFE)");

    const token = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail");
    const role = localStorage.getItem("userRole");
    let companyId = localStorage.getItem("companyId");

    // Geen token meer? Dan terug naar login
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const $reqBody = byId("request-table-body");
    const $revBody = byId("review-table-body");

    /* ============================================================
       1. Admin check (veiligheidsnet)
    ============================================================ */
    const isAdmin =
      role === "admin" ||
      (email &&
        (email.toLowerCase() === "admin@irisje.nl" ||
          email.toLowerCase() === "info@irisje.nl"));

    if (isAdmin) {
      window.location.href = "admin.html";
      return;
    }

    /* ============================================================
       2. Charts (MOET vóór updateCharts-calls staan)
       - voorkomt "Cannot access 'statusChart' before initialization"
    ============================================================ */
    let allRequests = [];
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

    /* ============================================================
       3. Default company instellen (NIEUW)
       - als companyId ontbreekt: haal /companies/my op, pak eerste, zet localStorage
    ============================================================ */
    async function ensureCompanyId() {
      if (companyId) return companyId;

      // Probeer automatisch een default bedrijf te kiezen
      try {
        const res = await authFetch(`${API_BASE}/companies/my`);
        const list = res?.companies;

        if (Array.isArray(list) && list.length > 0) {
          companyId = list[0]._id;
          localStorage.setItem("companyId", companyId);
          console.log("✅ Default company ingesteld:", companyId);
          return companyId;
        }
      } catch (err) {
        console.error("❌ Kon default company niet bepalen:", err);
      }

      // Geen bedrijf gevonden → toon nette melding en stop
      console.warn("❌ Geen companyId gevonden");
      if ($reqBody)
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4'>Geen bedrijf gevonden</td></tr>";
      if ($revBody)
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center p-4'>Geen bedrijf gevonden</td></tr>";
      return null;
    }

    const ensuredCompanyId = await ensureCompanyId();
    if (!ensuredCompanyId) return;

    /* ============================================================
       4. Company profile laden (met JWT)
       - FIX: response kan {ok:true,item:{...}} zijn
    ============================================================ */
    async function loadCompanyProfile() {
      try {
        const res = await authFetch(`${API_BASE}/companies/${companyId}`);
        const company = res?.item || res; // compat: beide vormen accepteren
        if (!company) throw new Error("Bedrijf niet gevonden");

        // /companies/lists retourneert in jouw backend vooral categories (en mogelijk later meer)
        // Daarom: tolerant maken (geen crash als specialties/certifications/languages ontbreken)
        let lists = null;
        try {
          lists = await authFetch(`${API_BASE}/companies/lists`);
        } catch (_) {
          lists = null;
        }

        fillCompanyForm(company);

        // Alleen renderen als de arrays bestaan
        renderSelectOptions(
          byId("companySpecialties"),
          Array.isArray(lists?.specialties) ? lists.specialties : [],
          company.specialties
        );
        renderSelectOptions(
          byId("companyCertifications"),
          Array.isArray(lists?.certifications) ? lists.certifications : [],
          company.certifications
        );
        renderSelectOptions(
          byId("companyLanguages"),
          Array.isArray(lists?.languages) ? lists.languages : [],
          company.languages
        );
      } catch (err) {
        console.error("❌ Fout bij bedrijfsprofiel:", err);
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
      form.companyRegions.value = Array.isArray(c.regions) ? c.regions.join(", ") : "";
      form.companyWorksNationwide.checked = !!c.worksNationwide;
    }

    function renderSelectOptions(select, options = [], selected = []) {
      if (!select || !Array.isArray(options)) return;
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
       5. Aanvragen (met JWT)
    ============================================================ */
    async function loadRequests() {
      try {
        const data = await authFetch(`${API_BASE}/requests/company/${companyId}`);

        // compat: sommige endpoints geven {ok:true,requests:[...]} terug, andere direct array
        const list = Array.isArray(data) ? data : data?.requests;

        allRequests = Array.isArray(list)
          ? list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];

        renderRequestTable();
      } catch (err) {
        console.error("❌ Fout aanvragen:", err);
        if ($reqBody) {
          $reqBody.innerHTML =
            "<tr><td colspan='5' class='text-center p-4 text-red-600'>Fout bij laden aanvragen.</td></tr>";
        }
      }
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
                  ${options
                    .map(
                      (o) =>
                        `<option value="${o}" ${
                          o === r.status ? "selected" : ""
                        }>${o}</option>`
                    )
                    .join("")}
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
            await authFetch(`${API_BASE}/dashboard/status/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });

            const idx = allRequests.findIndex((r) => r._id === id);
            if (idx >= 0) allRequests[idx].status = status;

            updateCharts();
            showNotif("Status opgeslagen");
          } catch (err) {
            console.error("❌ Status-update fout:", err);
            showNotif("Fout bij statusupdate", false);
          }
        })
      );

      updateCharts();
    }

    /* ============================================================
       6. Reviews (met JWT)
    ============================================================ */
    let allReviews = [];

    async function loadReviews() {
      try {
        const data = await authFetch(`${API_BASE}/reviews/company/${companyId}`);

        const list = Array.isArray(data) ? data : data?.reviews;

        allReviews = Array.isArray(list)
          ? list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];

        renderReviewsTable();
      } catch (err) {
        console.error("❌ Fout bij reviews:", err);
        if ($revBody) {
          $revBody.innerHTML =
            "<tr><td colspan='5' class='text-center p-4 text-red-600'>Fout bij laden reviews.</td></tr>";
        }
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
                ${
                  r.reported
                    ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
                    : `<button class="reportBtn bg-red-600 text-white px-2 py-1 rounded text-xs" data-id="${r._id}">Melden</button>`
                }
              </td>
            </tr>
          `;
        })
        .join("");

      document.querySelectorAll(".reportBtn").forEach((btn) =>
        btn.addEventListener("click", () => reportReview(btn.dataset.id))
      );
    }

    async function reportReview(reviewId) {
      if (!reviewId) return;
      if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;

      try {
        await authFetch(`${API_BASE}/reviews/report/${reviewId}`, { method: "POST" });
        showNotif("Review gemeld");
        await loadReviews();
      } catch (err) {
        console.error("❌ Review melden fout:", err);
        showNotif("Fout bij melden review", false);
      }
    }

    await Promise.all([loadRequests(), loadReviews()]);
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
    String(v ?? "").replace(/[&<>"']/g, (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );

  function showNotif(msg, success = true) {
    console.log(success ? "✅ " + msg : "❌ " + msg);
  }

  /**
   * 🛡️ Helper: fetch met JWT + auto-redirect bij 401/403
   */
  async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const merged = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    };

    const res = await fetch(url, merged);

    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!res.ok) {
      const msg = data?.error || data?.message || `Fout ${res.status} bij ${url}`;
      throw new Error(msg);
    }

    return data;
  }
})();
