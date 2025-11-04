const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerdersfallback
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length) {
        companyId = data[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.warn("Kon geen bedrijf koppelen via e-mail:", err);
    }
  }

  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $periodFilter = byId("periodFilter");
  const $statusFilter = byId("statusFilter");
  const $searchInput = byId("searchInput");
  const $sortSelect = byId("sortSelect");
  const $exportBtn = byId("exportCsvBtn");

  // ✅ CSV-notificatie
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  notif.textContent = "✅ CSV-bestand succesvol gedownload";
  document.body.appendChild(notif);
  function showNotif() {
    notif.classList.remove("hidden");
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s ease";
    setTimeout(() => (notif.style.opacity = "1"), 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  if (!companyId) {
    if ($reqBody)
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    if ($revBody)
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  let allRequests = [];
  let allReviews = [];
  let maandChart, statusChart, conversionChart;

  // =================
  // 📬 AANVRAGEN LADEN
  // =================
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      allRequests = Array.isArray(data)
        ? data.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      renderRequestTable();
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden aanvragen.</td></tr>";
      allRequests = [];
    }
  }

  // =================
  // 💬 REVIEWS LADEN
  // =================
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      allReviews = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : [];
      renderReviewsTable();
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden reviews.</td></tr>";
      allReviews = [];
    }
  }

  // ===========================
  // 📄 TABEL RENDERFUNCTIES
  // ===========================
  function renderRequestTable() {
    if (!$reqBody) return;
    const filtered = getFilteredRequests();
    if (!filtered.length) {
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      updateStatsAndCharts();
      return;
    }

    $reqBody.innerHTML = filtered
      .map((r) => {
        const d = new Date(r.createdAt || r.date);
        const datum = isNaN(d) ? "-" : d.toLocaleDateString("nl-NL");
        const status = r.status || "Nieuw";
        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
          <td class="p-3">${esc(r.name)}</td>
          <td class="p-3">${esc(r.email)}</td>
          <td class="p-3 max-w-xs truncate" title="${esc(r.message)}">${esc(r.message)}</td>
          <td class="p-3"><span class="px-2 py-1 rounded text-xs font-medium ${
            status === "Geaccepteerd"
              ? "bg-green-100 text-green-700"
              : status === "Afgewezen"
              ? "bg-red-100 text-red-700"
              : status === "Opgevolgd"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-indigo-100 text-indigo-700"
          }">${status}</span></td>
          <td class="p-3 whitespace-nowrap">${datum}</td></tr>`;
      })
      .join("");
    updateStatsAndCharts();
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

  // === volgende blok (grafieken + filters + helpers) komt in deel 2 ===

  // ===========================
  // 📊 STATISTIEKEN & GRAFIEKEN
  // ===========================
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

    // ====== GRAFIEK 1: aanvragen per maand ======
    const perMaand = {};
    filtered.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!isNaN(d)) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        perMaand[key] = (perMaand[key] || 0) + 1;
      }
    });

    const labels = Object.keys(perMaand).sort();
    const values = labels.map((k) => perMaand[k]);

    const ctx1 = byId("monthChart");
    const ctx2 = byId("statusChart");
    const ctx3 = byId("conversionChart");
    [ctx1, ctx2, ctx3].forEach((c) => c?.classList.add("chart-fade")); // ✨ fade-in

    if (ctx1) {
      if (maandChart) maandChart.destroy();
      maandChart = new Chart(ctx1, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Aanvragen",
              data: values,
              borderColor: "#4F46E5",
              backgroundColor: "rgba(79,70,229,0.2)",
              fill: true,
              tension: 0.4,
              pointRadius: 3,
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

    // ====== GRAFIEK 2: status verdeling ======
    const statusData = {
      Nieuw: allRequests.filter((r) => !r.status || r.status === "Nieuw").length,
      Geaccepteerd: accepted,
      Afgewezen: rejected,
      Opgevolgd: followedUp,
    };

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
                  const total = Object.values(statusData).reduce((a, b) => a + b, 0) || 1;
                  const pct = ((val / total) * 100).toFixed(1);
                  return ` ${ctx.label}: ${val} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    // ====== GRAFIEK 3: acceptatiepercentage ======
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

    const convLabels = Object.keys(convPerMaand).sort();
    const convValues = convLabels.map(
      (k) =>
        Math.round((convPerMaand[k].accepted / convPerMaand[k].total) * 100 * 10) /
          10 || 0
    );

    if (ctx3) {
      if (conversionChart) conversionChart.destroy();
      conversionChart = new Chart(ctx3, {
        type: "bar",
        data: {
          labels: convLabels,
          datasets: [
            {
              label: "Acceptatie (%)",
              data: convValues,
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

  // ===========================
  // 🔍 FILTERS & HELPERS
  // ===========================
  function filterRequestsByPeriod(list, p) {
    if (p === "all") return list;
    const now = new Date();
    const from = new Date(now);
    if (p === "6m") from.setMonth(now.getMonth() - 6);
    else if (p === "3m") from.setMonth(now.getMonth() - 3);
    else if (p === "1m") from.setMonth(now.getMonth() - 1);
    return list.filter((r) => new Date(r.createdAt) >= from);
  }

  function getFilteredRequests() {
    const statusVal = $statusFilter?.value || "ALLE";
    const searchVal = $searchInput?.value.trim().toLowerCase() || "";
    const sortVal = $sortSelect?.value || "date_desc";
    let arr = [...allRequests];

    if (statusVal !== "ALLE") arr = arr.filter((r) => (r.status || "Nieuw") === statusVal);
    if (searchVal)
      arr = arr.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(searchVal) ||
          (r.email || "").toLowerCase().includes(searchVal) ||
          (r.message || "").toLowerCase().includes(searchVal)
      );

    arr.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      switch (sortVal) {
        case "date_asc": return aDate - bDate;
        case "name_asc": return (a.name || "").localeCompare(b.name || "");
        case "name_desc": return (b.name || "").localeCompare(a.name || "");
        default: return bDate - aDate;
      }
    });
    return arr;
  }

  // ===========================
  // 🚩 REVIEW MELDEN
  // ===========================
  window.meldReview = async function (id) {
    if (!confirm("Weet je zeker dat je deze review wilt melden aan de beheerder?")) return;
    try {
      const res = await fetch(`${API_BASE}/reviews/report/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      alert("✅ Review is gemeld aan de beheerder.");
      await loadReviews();
    } catch {
      alert("❌ Er ging iets mis bij het melden van de review.");
    }
  };

  // ===========================
  // 📤 EXPORT CSV
  // ===========================
  function exportToCsv(list) {
    if (!list.length) return alert("Geen data om te exporteren.");
    const rows = [["Naam", "E-mail", "Bericht", "Status", "Datum"],
      ...list.map((r) => [
        r.name || "",
        r.email || "",
        (r.message || "").replace(/\r?\n|\r/g, " "),
        r.status || "Nieuw",
        new Date(r.createdAt || r.date).toLocaleString("nl-NL"),
      ]),
    ];
    const csv = rows.map((r) =>
      r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "irisje-aanvragen.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===========================
  // EVENT LISTENERS & INIT
  // ===========================
  [$statusFilter, $periodFilter, $searchInput, $sortSelect].forEach((el) =>
    el?.addEventListener("change", renderRequestTable)
  );
  $exportBtn?.addEventListener("click", () => {
    const data = getFilteredRequests();
    exportToCsv(data);
    showNotif();
  });
  byId("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  await Promise.all([loadRequests(), loadReviews()]);
}

// ===========================
// 🔧 HULPFUNCTIES
// ===========================
function byId(id) { return document.getElementById(id); }
function setText(id, val) { const el = byId(id); if (el) el.textContent = val; }
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
  );
}
