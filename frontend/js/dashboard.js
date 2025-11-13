// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  // ====== hulpfuncties ======
  const $ = (sel, el = document) => el.querySelector(sel);
  const byId = (id) => document.getElementById(id);
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => (clearTimeout(t), (t = setTimeout(() => fn(...args), ms)));
  };

  // ====== UI refs ======
  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $periodFilter = byId("periodFilter");
  const $statusFilter = byId("statusFilter");
  const $searchInput = byId("searchInput");
  const $sortSelect = byId("sortSelect");
  const $exportBtn = byId("exportCsvBtn");
  const $logoutBtn = byId("logoutBtn");

  // Bestaande profiel-form elementen uit dashboard.html
  const form = byId("companyForm");
  const $specialtiesList = byId("companySpecialties") || byId("specialtiesList");
  const $certificationsList = byId("companyCertifications") || byId("certificationsList");
  const $languagesList = byId("companyLanguages") || byId("languagesList");

  // Notificatie
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  notif.textContent = "✅ Handeling voltooid";
  document.body.appendChild(notif);
  function showNotif(msg = "✅ Opgeslagen") {
    notif.textContent = msg;
    notif.classList.remove("hidden");
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s ease";
    requestAnimationFrame(() => (notif.style.opacity = "1"));
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  // ====== authenticatie / context ======
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");
  let companySlug = localStorage.getItem("companySlug");

  // Beheerdersfallback (koppel eerste bedrijf wanneer geen companyId bekend is)
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();
      if (res.ok && data.items?.length) {
        companyId = data.items[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.warn("Kon geen bedrijf koppelen via e-mail:", err);
    }
  }

  if (!companyId && !$reqBody && !$revBody && !form) {
    // Niets te tonen en geen bedrijf bekend
    return;
  }

  // ====== data state ======
  let lists = { specialties: [], certifications: [], languages: [] };
  let currentCompany = null;
  let allRequests = [];
  let allReviews = [];

  // charts state
  let maandChart, statusChart, conversionChart;

  // ====== helpers data ophalen ======
  async function fetchJson(url, init) {
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  }

  async function getLists() {
    try {
      const data = await fetchJson(`${API_BASE}/companies/lists`);
      lists = {
        specialties: data.specialties || [],
        certifications: data.certifications || [],
        languages: data.languages || [],
      };
    } catch (e) {
      console.warn("Kon lijsten niet laden:", e);
      lists = { specialties: [], certifications: [], languages: [] };
    }
  }

  // Probeer bedrijf op te halen via :id → via slug → via lijst fallback
  async function getCompany() {
    // 1) direct via :id (als backend dit ondersteunt)
    if (companyId) {
      try {
        return await fetchJson(`${API_BASE}/companies/${companyId}`);
      } catch (_) {
        // ga door naar fallback
      }
    }
    // 2) via slug
    if (companySlug) {
      try {
        return await fetchJson(`${API_BASE}/companies/slug/${encodeURIComponent(companySlug)}`);
      } catch (_) {}
    }
    // 3) fallback: vind in volledige lijst
    try {
      const list = await fetchJson(`${API_BASE}/companies`);
      const items = list.items || [];
      if (companyId) {
        const found = items.find((c) => c._id === companyId);
        if (found) return found;
      }
      if (companySlug) {
        const found = items.find((c) => c.slug === companySlug);
        if (found) return found;
      }
      return items[0] || null;
    } catch (e) {
      console.error("Geen bedrijf gevonden:", e);
      return null;
    }
  }

  // ====== profiel-form vul & render ======
  function selectOrCheckboxContainer(container, options = [], selected = []) {
    // Ondersteunt <select multiple> (preferred) of een div met checkboxes
    if (!container) return;

    // Case 1: <select multiple>
    if (container.tagName === "SELECT") {
      container.innerHTML = "";
      options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (selected?.includes(opt)) o.selected = true;
        container.appendChild(o);
      });
      return;
    }

    // Case 2: checkbox container
    container.innerHTML = options
      .map(
        (opt) => `
        <label class="flex items-center gap-1 text-sm">
          <input type="checkbox" value="${opt}" ${selected?.includes(opt) ? "checked" : ""} class="accent-indigo-600">
          ${opt}
        </label>`
      )
      .join("");
  }

  function arrayFromContainer(container) {
    if (!container) return [];
    if (container.tagName === "SELECT") {
      return Array.from(container.selectedOptions).map((o) => o.value);
    }
    return Array.from(container.querySelectorAll("input[type='checkbox']:checked")).map((i) => i.value);
  }

  function fillCompanyForm(c) {
    if (!form || !c) return;

    // support jouw dashboard.html-IDs
    (form.elements.name || byId("companyName")).value = c.name || "";
    (form.elements.tagline || byId("companyTagline"))?.value !== undefined &&
      ((form.elements.tagline || byId("companyTagline")).value = c.tagline || "");
    (form.elements.description || byId("companyDescription")).value = c.description || "";
    (form.elements.city || byId("companyCity")).value = c.city || "";
    (form.elements.phone || byId("companyPhone")).value = c.phone || "";
    (form.elements.website || byId("companyWebsite")).value = c.website || "";
    (form.elements.availability || byId("companyAvailability"))?.value !== undefined &&
      ((form.elements.availability || byId("companyAvailability")).value = c.availability || "");
    const regionsEl = form.elements.regions || byId("companyRegions");
    if (regionsEl) regionsEl.value = Array.isArray(c.regions) ? c.regions.join(", ") : "";

    const worksNationwideEl = form.elements.worksNationwide || byId("companyWorksNationwide");
    if (worksNationwideEl) worksNationwideEl.checked = !!c.worksNationwide;

    selectOrCheckboxContainer($specialtiesList, lists.specialties, c.specialties || []);
    selectOrCheckboxContainer($certificationsList, lists.certifications, c.certifications || []);
    selectOrCheckboxContainer($languagesList, lists.languages, c.languages || []);
  }

  function collectCompanyForm() {
    const get = (name, fallbackId) => (form.elements[name] || byId(fallbackId));
    const parseList = (val) =>
      String(val || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    return {
      name: get("name", "companyName")?.value?.trim() || "",
      tagline: get("tagline", "companyTagline")?.value?.trim() || "",
      description: get("description", "companyDescription")?.value?.trim() || "",
      city: get("city", "companyCity")?.value?.trim() || "",
      phone: get("phone", "companyPhone")?.value?.trim() || "",
      website: get("website", "companyWebsite")?.value?.trim() || "",
      availability: get("availability", "companyAvailability")?.value?.trim() || "",
      regions: parseList(get("regions", "companyRegions")?.value),
      worksNationwide: !!get("worksNationwide", "companyWorksNationwide")?.checked,
      specialties: arrayFromContainer($specialtiesList),
      certifications: arrayFromContainer($certificationsList),
      languages: arrayFromContainer($languagesList),
    };
  }

  // ====== profiel laden ======
  async function loadCompanyProfile() {
    try {
      await getLists();
      currentCompany = await getCompany();
      if (!currentCompany) throw new Error("Bedrijf niet gevonden");

      // zet id/slug in localStorage voor vervolg
      if (currentCompany._id) {
        companyId = currentCompany._id;
        localStorage.setItem("companyId", companyId);
      }
      if (currentCompany.slug) {
        companySlug = currentCompany.slug;
        localStorage.setItem("companySlug", companySlug);
      }

      fillCompanyForm(currentCompany);
    } catch (err) {
      console.error("Fout bij laden bedrijfsprofiel:", err);
      showNotif("❌ Kon bedrijfsprofiel niet laden");
    }
  }

  // ====== profiel opslaan ======
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!companyId) return showNotif("❌ Geen bedrijf gekoppeld");

    const body = collectCompanyForm();

    try {
      const res = await fetch(`${API_BASE}/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      showNotif("✅ Bedrijfsprofiel opgeslagen");
    } catch (err) {
      console.error("Fout bij opslaan profiel:", err);
      showNotif("❌ Opslaan mislukt");
    }
  });

  // ====== AANVRAGEN ======
  async function loadRequests() {
    if (!companyId) return;
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      allRequests = Array.isArray(data)
        ? data
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
        : [];
      renderRequestTable();
      updateStatsAndCharts();
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      if ($reqBody)
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden aanvragen.</td></tr>";
      allRequests = [];
      updateStatsAndCharts();
    }
  }

  // ====== REVIEWS ======
  async function loadReviews() {
    if (!companyId) return;
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      allReviews = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      renderReviewsTable();
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      if ($revBody)
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden reviews.</td></tr>";
      allReviews = [];
    }
  }

  // ====== TABELLEN ======
  function renderRequestTable() {
    if (!$reqBody) return;
    const rows = getFilteredRequests();
    if (!rows.length) {
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      return;
    }
    // minimal DOM writes
    const html = rows
      .map((r) => {
        const d = new Date(r.createdAt || r.date);
        const datum = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");
        const status = r.status || "Nieuw";
        const badge =
          status === "Geaccepteerd"
            ? "bg-green-100 text-green-700"
            : status === "Afgewezen"
            ? "bg-red-100 text-red-700"
            : status === "Opgevolgd"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-indigo-100 text-indigo-700";
        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
          <td class="p-3">${esc(r.name)}</td>
          <td class="p-3">${esc(r.email)}</td>
          <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
          <td class="p-3"><span class="px-2 py-1 rounded text-xs font-medium ${badge}">${status}</span></td>
          <td class="p-3 whitespace-nowrap">${datum}</td>
        </tr>`;
      })
      .join("");
    $reqBody.innerHTML = html;
  }

  function renderReviewsTable() {
    if (!$revBody) return;
    if (!allReviews.length) {
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      return;
    }
    const html = allReviews
      .map((r) => {
        const d = new Date(r.createdAt);
        const datum = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");
        const stars = r.rating ? "⭐".repeat(r.rating) : "-";
        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
          <td class="p-3">${esc(r.reviewerName || r.name || "Onbekend")}</td>
          <td class="p-3">${stars}</td>
          <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
          <td class="p-3 whitespace-nowrap">${datum}</td>
          <td class="p-3">${
            r.reported
              ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
              : `<button data-id="${r._id}" class="btn-report bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition">Melden</button>`
          }</td>
        </tr>`;
      })
      .join("");
    $revBody.innerHTML = html;

    // bind één eventlistener via event delegation
    $revBody.addEventListener("click", async (e) => {
      const btn = e.target.closest(".btn-report");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (!id) return;
      if (!confirm("Weet je zeker dat je deze review wilt melden aan de beheerder?")) return;
      try {
        const r = await fetch(`${API_BASE}/reviews/report/${id}`, { method: "PATCH" });
        if (!r.ok) throw new Error();
        showNotif("✅ Review is gemeld aan de beheerder.");
        await loadReviews();
      } catch {
        showNotif("❌ Er ging iets mis bij het melden van de review.");
      }
    }, { once: true });
  }

  // ====== FILTERS ======
  function filterRequestsByPeriod(list, p) {
    if (p === "all") return list;
    const now = new Date();
    const from = new Date(now);
    if (p === "6m") from.setMonth(now.getMonth() - 6);
    else if (p === "3m") from.setMonth(now.getMonth() - 3);
    else if (p === "1m") from.setMonth(now.getMonth() - 1);
    return list.filter((r) => new Date(r.createdAt || r.date) >= from);
  }

  function getFilteredRequests() {
    const statusVal = $statusFilter?.value || "ALLE";
    const searchVal = ($searchInput?.value || "").trim().toLowerCase();
    const sortVal = $sortSelect?.value || "date_desc";
    const periodVal = $periodFilter?.value || "all";

    let arr = filterRequestsByPeriod(allRequests, periodVal);

    if (statusVal !== "ALLE") arr = arr.filter((r) => (r.status || "Nieuw") === statusVal);
    if (searchVal)
      arr = arr.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(searchVal) ||
          (r.email || "").toLowerCase().includes(searchVal) ||
          (r.message || "").toLowerCase().includes(searchVal)
      );

    arr.sort((a, b) => {
      const aDate = new Date(a.createdAt || a.date);
      const bDate = new Date(b.createdAt || b.date);
      switch (sortVal) {
        case "date_asc":
          return aDate - bDate;
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return bDate - aDate;
      }
    });

    return arr;
  }

  // ====== STATISTIEKEN & GRAFIEKEN ======
  function updateStatsAndCharts() {
    const total = allRequests.length;
    const accepted = allRequests.filter((r) => r.status === "Geaccepteerd").length;
    const rejected = allRequests.filter((r) => r.status === "Afgewezen").length;
    const followedUp = allRequests.filter((r) => r.status === "Opgevolgd").length;

    setText("total", total);
    setText("accepted", accepted);
    setText("rejected", rejected);
    setText("followed-up", followedUp);

    const periodValue = $periodFilter ? $periodFilter.value : "all";
    const filtered = filterRequestsByPeriod(allRequests, periodValue);

    // grafiek 1: aanvragen per maand
    const perMaand = {};
    filtered.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        perMaand[key] = (perMaand[key] || 0) + 1;
      }
    });
    const labels1 = Object.keys(perMaand).sort();
    const values1 = labels1.map((k) => perMaand[k]);

    // grafiek 2: status verdeling
    const statusData = {
      Nieuw: allRequests.filter((r) => !r.status || r.status === "Nieuw").length,
      Geaccepteerd: accepted,
      Afgewezen: rejected,
      Opgevolgd: followedUp,
    };

    // grafiek 3: conversie per maand
    const convPerMaand = {};
    filtered.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!convPerMaand[key]) convPerMaand[key] = { total: 0, accepted: 0 };
        convPerMaand[key].total++;
        if (r.status === "Geaccepteerd") convPerMaand[key].accepted++;
      }
    });
    const labels3 = Object.keys(convPerMaand).sort();
    const values3 = labels3.map((k) =>
      Math.round((convPerMaand[k].accepted / convPerMaand[k].total) * 1000) / 10 || 0
    );

    const ctx1 = byId("monthChart");
    const ctx2 = byId("statusChart");
    const ctx3 = byId("conversionChart");

    if (ctx1) {
      if (maandChart) maandChart.destroy();
      maandChart = new Chart(ctx1, {
        type: "line",
        data: {
          labels: labels1,
          datasets: [
            {
              label: "Aanvragen",
              data: values1,
              borderColor: "#4F46E5",
              backgroundColor: "rgba(79,70,229,0.2)",
              fill: true,
              tension: 0.35,
              pointRadius: 2.5,
              pointHoverRadius: 5,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    if (ctx2) {
      if (statusChart) statusChart.destroy();
      statusChart = new Chart(ctx2, {
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
              borderWidth: 0,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed || 0;
                  const total2 = Object.values(statusData).reduce((a, b) => a + b, 0) || 1;
                  const pct = ((val / total2) * 100).toFixed(1);
                  return ` ${ctx.label}: ${val} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    if (ctx3) {
      if (conversionChart) conversionChart.destroy();
      conversionChart = new Chart(ctx3, {
        type: "bar",
        data: {
          labels: labels3,
          datasets: [
            {
              label: "Acceptatie (%)",
              data: values3,
              backgroundColor: "rgba(34,197,94,0.7)",
              borderRadius: 6,
              maxBarThickness: 28,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } } },
        },
      });
    }
  }

  // ====== EXPORT CSV ======
  function exportToCsv(list) {
    if (!list.length) return alert("Geen data om te exporteren.");
    const rows = [
      ["Naam", "E-mail", "Bericht", "Status", "Datum"],
      ...list.map((r) => [
        r.name || "",
        r.email || "",
        String(r.message || "").replace(/\r?\n|\r/g, " "),
        r.status || "Nieuw",
        new Date(r.createdAt || r.date).toLocaleString("nl-NL"),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "irisje-aanvragen.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotif("✅ CSV-bestand succesvol gedownload");
  }

  // ====== EVENTS ======
  $logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  $periodFilter?.addEventListener("change", () => {
    renderRequestTable();
    updateStatsAndCharts();
  });
  $statusFilter?.addEventListener("change", () => {
    renderRequestTable();
    updateStatsAndCharts();
  });
  $sortSelect?.addEventListener("change", () => {
    renderRequestTable();
  });
  $searchInput?.addEventListener(
    "input",
    debounce(() => {
      renderRequestTable();
    }, 200)
  );
  $exportBtn?.addEventListener("click", () => {
    const data = getFilteredRequests();
    exportToCsv(data);
  });

  // ====== INIT LOAD ======
  await loadCompanyProfile();
  await Promise.all([loadRequests(), loadReviews()]);
  updateStatsAndCharts();

  // ====== interne helpers die UI-elementen nodig hebben ======
  function setText(id, val) {
    const el = byId(id);
    if (el) el.textContent = val;
  }
}
