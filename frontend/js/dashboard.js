// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerdersfallback (bedrijf koppelen via e-mail)
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data) && data.length) {
        companyId = data[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.warn("Kon geen bedrijf koppelen op basis van e-mail:", err);
    }
  }

  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $statusFilter = byId("statusFilter");
  const $periodFilter = byId("periodFilter");
  const $searchInput = byId("searchInput");
  const $sortSelect = byId("sortSelect");
  const $exportBtn = byId("exportCsvBtn");

  // ✅ Notificatiebalk toevoegen voor CSV-export
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

  // 🚨 Geen bedrijf gevonden
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

  // charts refs
  let maandChart, statusChart, conversionChart;

  // =================
  // 📬 AANVRAGEN LADEN
  // =================
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord (requests)");
      allRequests = data
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      renderRequestTable();
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      if ($reqBody)
        $reqBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden aanvragen.</td></tr>";
      allRequests = [];
      updateStatsAndCharts();
    }
  }

  // =================
  // 💬 REVIEWS LADEN
  // =================
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord (reviews)");
      allReviews = [...data].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      renderReviewsTable();
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      if ($revBody)
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
      .map((req) => {
        const d = new Date(req.createdAt || req.date);
        const datum = !isNaN(d)
          ? d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";
        const status = req.status || "Nieuw";

        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="p-3">${esc(req.name)}</td>
            <td class="p-3">${esc(req.email)}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(req.message)}">${esc(req.message)}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded text-xs font-medium ${
                status === "Geaccepteerd"
                  ? "bg-green-100 text-green-700"
                  : status === "Afgewezen"
                  ? "bg-red-100 text-red-700"
                  : status === "Opgevolgd"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-indigo-100 text-indigo-700"
              }">${status}</span>
            </td>
            <td class="p-3 whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    updateStatsAndCharts();
  }

  function renderReviewsTable() {
    if (!$revBody) return;
    if (!allReviews?.length) {
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      return;
    }

    $revBody.innerHTML = allReviews
      .map((rev) => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = !isNaN(d)
          ? d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";

        return `<tr class="border-b border-gray-50 hover:bg-gray-50">
            <td class="p-3">${esc(rev.reviewerName || rev.name || "Onbekend")}</td>
            <td class="p-3">${rev.rating ? "⭐".repeat(rev.rating) : "-"}</td>
            <td class="p-3 max-w-xs truncate" title="${esc(rev.message)}">${esc(rev.message)}</td>
            <td class="p-3 whitespace-nowrap">${datum}</td>
            <td class="p-3">
              ${
                rev.reported
                  ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
                  : `<button onclick="meldReview('${rev._id}')"
                      class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition">
                      Melden
                    </button>`
              }
            </td>
          </tr>`;
      })
      .join("");
  }

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
    const filteredForCharts = filterRequestsByPeriod(allRequests, periodValue);

    const perMaand = {};
    filteredForCharts.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!d || isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      perMaand[key] = (perMaand[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(perMaand).sort();
    const labels = sortedKeys.map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" });
    });
    const values = sortedKeys.map((k) => perMaand[k]);

    const ctx1 = document.getElementById("monthChart");
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
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} aanvragen` } },
          },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }

    const statusData = {
      Nieuw: allRequests.filter((r) => !r.status || r.status === "Nieuw").length,
      Geaccepteerd: accepted,
      Afgewezen: rejected,
      Opgevolgd: followedUp,
    };
    const totalForPercent = Object.values(statusData).reduce((a, b) => a + b, 0) || 1;

    const ctx2 = document.getElementById("statusChart");
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
          responsive: true,
          plugins: {
            legend: { position: "bottom", labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const label = ctx.label || "";
                  const val = ctx.parsed || 0;
                  const pct = ((val / totalForPercent) * 100).toFixed(1);
                  return ` ${label}: ${val} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    const convPerMaand = {};
    filteredForCharts.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!d || isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!convPerMaand[key]) convPerMaand[key] = { total: 0, accepted: 0 };
      convPerMaand[key].total += 1;
      if (r.status === "Geaccepteerd") convPerMaand[key].accepted += 1;
    });

    const convKeys = Object.keys(convPerMaand).sort();
    const convLabels = convKeys.map((k) => {
      const [year, month] = k.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return date.toLocaleDateString("nl-NL", { month: "short", year: "numeric" });
    });
    const convValues = convKeys.map((k) => {
      const { total, accepted } = convPerMaand[k];
      if (!total) return 0;
      return Number(((accepted / total) * 100).toFixed(1));
    });

    const ctx3 = document.getElementById("conversionChart");
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
              maxBarThickness: 30,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y}% geaccepteerd` } },
          },
          scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } } },
        },
      });
    }
  }

  function filterRequestsByPeriod(list, period) {
    if (period === "all") return list;
    const now = new Date();
    const from = new Date(now);
    if (period === "6m") from.setMonth(from.getMonth() - 6);
    else if (period === "3m") from.setMonth(from.getMonth() - 3);
    else if (period === "1m") from.setMonth(from.getMonth() - 1);
    return list.filter((r) => {
      const d = new Date(r.createdAt || r.date);
      if (!d || isNaN(d)) return false;
      return d >= from;
    });
  }

  function getFilteredRequests() {
    const statusVal = $statusFilter ? $statusFilter.value : "ALLE";
    const searchVal = $searchInput ? $searchInput.value.trim().toLowerCase() : "";
    const sortVal = $sortSelect ? $sortSelect.value : "date_desc";

    let arr = [...allRequests];
    if (statusVal !== "ALLE") arr = arr.filter((r) => (r.status || "Nieuw") === statusVal);
    if (searchVal) {
      arr = arr.filter((r) => {
        const name = (r.name || "").toLowerCase();
        const email = (r.email || "").toLowerCase();
        const msg = (r.message || "").toLowerCase();
        return name.includes(searchVal) || email.includes(searchVal) || msg.includes(searchVal);
      });
    }
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

  window.meldReview = async function (id) {
    if (!confirm("Weet je zeker dat je deze review wilt melden aan de beheerder?")) return;
    try {
      const res = await fetch(`${API_BASE}/reviews/report/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      alert("✅ Review is gemeld aan de beheerder.");
      await loadReviews();
    } catch (err) {
      console.error("Fout bij melden review:", err);
      alert("❌ Er ging iets mis bij het melden van de review.");
    }
  };

  if ($statusFilter) $statusFilter.addEventListener("change", renderRequestTable);
  if ($periodFilter) $periodFilter.addEventListener("change", updateStatsAndCharts);
  if ($searchInput) $searchInput.addEventListener("input", renderRequestTable);
  if ($sortSelect) $sortSelect.addEventListener("change", renderRequestTable);

  if ($exportBtn) {
    $exportBtn.addEventListener("click", () => {
      const data = getFilteredRequests();
      exportToCsv(data);
      showNotif(); // ✅ melding tonen
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  await Promise.all([loadRequests(), loadReviews()]);
}

function byId(id) {
  return document.getElementById(id);
}

function setText(id, val) {
  const el = byId(id);
  if (el) el.textContent = val;
}

function esc(v) {
  if (v == null) return "";
  return String(v).replace(/[&<>"']/g, (s) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
  });
}

function exportToCsv(list) {
  if (!list || !list.length) {
    alert("Geen data om te exporteren.");
    return;
  }

  const rows = [
    ["Naam", "E-mail", "Bericht", "Status", "Datum"],
    ...list.map((r) => [
      r.name || "",
      r.email || "",
      (r.message || "").replace(/\r?\n|\r/g, " "),
      r.status || "Nieuw",
      new Date(r.createdAt || r.date).toLocaleString("nl-NL"),
    ]),
  ];

  const csvContent = rows.map((row) => row.map(csvEscape).join(";")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "irisje-aanvragen.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
