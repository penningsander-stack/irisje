// frontend/js/dashboard.js
(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  document.addEventListener("DOMContentLoaded", initDashboard);

  async function initDashboard() {
    console.log("📊 Dashboard gestart (v20251113)");

    const email = localStorage.getItem("userEmail");
    let companyId = localStorage.getItem("companyId");

    /* ============================================================
       🟣 Beheerdersfallback (info@irisje.nl)
    ============================================================ */
    if (email === "info@irisje.nl" && !companyId) {
      try {
        const res = await fetch(`${API_BASE}/companies`);
        const data = await res.json();
        if (res.ok && data.items?.length) {
          companyId = data.items[0]._id;
          localStorage.setItem("companyId", companyId);
          console.log("✅ Beheerder gekoppeld aan bedrijf:", companyId);
        }
      } catch (err) {
        console.warn("⚠️ Geen bedrijf gevonden voor beheerder:", err);
      }
    }

    const $reqBody = byId("request-table-body");
    const $revBody = byId("review-table-body");

    /* ============================================================
       🔔 Universele notificatie
    ============================================================ */
    const notif = document.createElement("div");
    notif.id = "notif";
    notif.className =
      "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
    document.body.appendChild(notif);

    function showNotif(msg = "✅ Opgeslagen", success = true) {
      notif.textContent = msg;
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

    if (!companyId) {
      console.warn("❌ Geen bedrijfId gevonden — inloggen vereist");
      if ($reqBody)
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
      if ($revBody)
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
      return;
    }

    /* ============================================================
       🏢 Bedrijfsprofiel laden
    ============================================================ */
    const form = byId("companyForm");
    const $specialtiesList = byId("companySpecialties");
    const $certificationsList = byId("companyCertifications");
    const $languagesList = byId("companyLanguages");

    let allRequests = [];
    let allReviews = [];
    let statusChart;

    async function loadCompanyProfile() {
      try {
        const [companyRes, listRes] = await Promise.all([
          fetch(`${API_BASE}/companies/slug/${companyId}`).then((r) =>
            r.ok ? r.json() : null
          ),
          fetch(`${API_BASE}/companies/lists`).then((r) => r.json()),
        ]);

        if (!companyRes) throw new Error("Bedrijf niet gevonden");
        fillCompanyForm(companyRes);
        renderSelectOptions($specialtiesList, listRes.specialties, companyRes.specialties);
        renderSelectOptions($certificationsList, listRes.certifications, companyRes.certifications);
        renderSelectOptions($languagesList, listRes.languages, companyRes.languages);
      } catch (err) {
        console.error("❌ Fout bij laden bedrijfsprofiel:", err);
        showNotif("Kon bedrijfsprofiel niet laden", false);
      }
    }

    function fillCompanyForm(c) {
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
          (opt) => `<option value="${opt}" ${
            selected?.includes(opt) ? "selected" : ""
          }>${opt}</option>`
        )
        .join("");
    }

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const body = {
        name: form.companyName.value.trim(),
        city: form.companyCity.value.trim(),
        phone: form.companyPhone.value.trim(),
        website: form.companyWebsite.value.trim(),
        regions: form.companyRegions.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        availability: form.companyAvailability.value.trim(),
        worksNationwide: form.companyWorksNationwide.checked,
        specialties: Array.from(form.companySpecialties.selectedOptions).map((o) => o.value),
        certifications: Array.from(form.companyCertifications.selectedOptions).map((o) => o.value),
        languages: Array.from(form.companyLanguages.selectedOptions).map((o) => o.value),
      };

      try {
        const res = await fetch(`${API_BASE}/companies/${companyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
        showNotif("✅ Bedrijfsprofiel opgeslagen");
      } catch (err) {
        console.error("❌ Opslaan mislukt:", err);
        showNotif("Opslaan mislukt", false);
      }
    });

    await loadCompanyProfile();

    /* ============================================================
       📬 AANVRAGEN LADEN
    ============================================================ */
    async function loadRequests() {
      try {
        const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
        const data = await res.json();
        allRequests = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
        renderRequestTable();
      } catch (err) {
        console.error("❌ Fout bij laden aanvragen:", err);
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
      }
    }

    function renderRequestTable() {
      if (!$reqBody) return;
      if (!allRequests.length) {
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
        updateCharts();
        return;
      }

      const options = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"];
      $reqBody.innerHTML = allRequests
        .map((r) => {
          const d = new Date(r.createdAt || r.date);
          const datum = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");
          return `<tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="p-3">${esc(r.name)}</td>
            <td class="p-3">${esc(r.email)}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
            <td class="p-3">
              <select data-id="${r._id}" class="statusSelect border rounded px-2 py-1 text-sm">
                ${options
                  .map(
                    (opt) => `<option value="${opt}" ${
                      r.status === opt ? "selected" : ""
                    }>${opt}</option>`
                  )
                  .join("")}
              </select>
            </td>
            <td class="p-3 whitespace-nowrap">${datum}</td>
          </tr>`;
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
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fout");
            const index = allRequests.findIndex((r) => r._id === id);
            if (index >= 0) allRequests[index].status = status;
            updateCharts();
            showNotif("✅ Status bijgewerkt");
          } catch (err) {
            console.error("❌ Status-update mislukt:", err);
            showNotif("Fout bij statusupdate", false);
          }
        })
      );

      updateCharts();
    }

    /* ============================================================
       ⭐ REVIEWS LADEN
    ============================================================ */
    async function loadReviews() {
      try {
        const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
        const data = await res.json();
        allReviews = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
        renderReviewsTable();
      } catch (err) {
        console.error("❌ Fout bij laden reviews:", err);
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
      }
    }

    function renderReviewsTable() {
      if (!$revBody) return;
      if (!allReviews.length) {
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      $revBody.innerHTML = allReviews
        .map((r) => {
          const d = new Date(r.createdAt);
          const datum = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");
          return `<tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="p-3">${esc(r.reviewerName || r.name || "Onbekend")}</td>
            <td class="p-3">${r.rating ? "⭐".repeat(r.rating) : "-"}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
            <td class="p-3 whitespace-nowrap">${datum}</td>
            <td class="p-3">${
              r.reported
                ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
                : `<button onclick="meldReview('${r._id}')"
                  class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition">
                  Melden</button>`
            }</td></tr>`;
        })
        .join("");
    }

    /* ============================================================
       📈 GRAFIEKEN
    ============================================================ */
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

      const statusData = {
        Nieuw: allRequests.filter((r) => !r.status || r.status === "Nieuw").length,
        Geaccepteerd: accepted,
        Afgewezen: rejected,
        Opgevolgd: followed,
      };

      if (statusChart) statusChart.destroy();
      statusChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(statusData),
          datasets: [
            {
              data: Object.values(statusData),
              backgroundColor: [
                "rgba(99,102,241,0.7)",
                "rgba(34,197,94,0.7)",
                "rgba(239,68,68,0.7)",
                "rgba(234,179,8,0.7)",
              ],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });
    }

    await Promise.all([loadRequests(), loadReviews()]);
  }

  /* ============================================================
     🔧 HULPFUNCTIES
  ============================================================ */
  function byId(id) {
    return document.getElementById(id);
  }
  function setText(id, val) {
    const el = byId(id);
    if (el) el.textContent = val;
  }
  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
  }
})();
