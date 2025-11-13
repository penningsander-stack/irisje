// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initDashboard);

async function initDashboard() {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("companyId");
  const email = localStorage.getItem("userEmail");

  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $periodFilter = byId("periodFilter");
  const $statusFilter = byId("statusFilter");
  const $searchInput = byId("searchInput");
  const $sortSelect = byId("sortSelect");
  const $exportBtn = byId("exportCsvBtn");

  // 🔔 Notificatie
  const notif = document.createElement("div");
  notif.id = "notif";
  notif.className =
    "hidden fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50";
  document.body.appendChild(notif);
  function showNotif(msg = "✅ Opgeslagen") {
    notif.textContent = msg;
    notif.classList.remove("hidden");
    notif.style.opacity = "0";
    notif.style.transition = "opacity 0.3s ease";
    setTimeout(() => (notif.style.opacity = "1"), 10);
    setTimeout(() => {
      notif.style.opacity = "0";
      setTimeout(() => notif.classList.add("hidden"), 300);
    }, 2500);
  }

  if (!companyId || !token) {
    $reqBody.innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Log opnieuw in om je dashboard te laden.</td></tr>";
    $revBody.innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  /* ============================================================
     📊 Dashboarddata laden
  ============================================================ */
  let allRequests = [];
  let charts = {};

  async function loadDashboardData() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Onbekende fout");

      const { stats, requests } = data;
      allRequests = requests || [];

      // Update cijfers
      setText("total", stats.total);
      setText("accepted", stats.accepted);
      setText("rejected", stats.rejected);
      setText("followed-up", stats.followed);

      renderRequestTable();
      renderStatusChart(stats);
      renderMonthChart(requests);
      renderConversionChart(requests);
    } catch (err) {
      console.error("❌ Fout bij laden dashboarddata:", err);
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Kon dashboarddata niet laden.</td></tr>";
    }
  }

  /* ============================================================
     📋 Aanvragen tabel
  ============================================================ */
  function renderRequestTable() {
    if (!allRequests.length) {
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-400 p-4'>Nog geen aanvragen ontvangen.</td></tr>";
      return;
    }

    const filtered = filterAndSortRequests(allRequests);
    $reqBody.innerHTML = filtered
      .map(
        (r) => `
      <tr class="border-b hover:bg-gray-50 transition">
        <td class="p-3">${esc(r.name)}</td>
        <td class="p-3">${esc(r.email)}</td>
        <td class="p-3">${esc(r.message || "").slice(0, 80)}</td>
        <td class="p-3">${esc(r.status || "Nieuw")}</td>
        <td class="p-3 text-gray-500">${formatDate(r.createdAt)}</td>
      </tr>`
      )
      .join("");
  }

  function filterAndSortRequests(requests) {
    const status = $statusFilter?.value || "ALLE";
    const term = ($searchInput?.value || "").toLowerCase();
    const sort = $sortSelect?.value || "date_desc";

    let result = requests;
    if (status !== "ALLE") {
      result = result.filter((r) => (r.status || "Nieuw") === status);
    }
    if (term) {
      result = result.filter(
        (r) =>
          r.name?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.message?.toLowerCase().includes(term)
      );
    }

    if (sort === "date_desc") result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === "date_asc") result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sort === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "name_desc") result.sort((a, b) => b.name.localeCompare(a.name));

    return result;
  }

  // Filters + zoekvelden
  [$statusFilter, $searchInput, $sortSelect].forEach((el) =>
    el?.addEventListener("input", renderRequestTable)
  );

  /* ============================================================
     📊 Grafieken
  ============================================================ */
  function renderStatusChart(stats) {
    const ctx = document.getElementById("statusChart");
    if (!ctx) return;

    if (charts.status) charts.status.destroy();
    charts.status = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Geaccepteerd", "Afgewezen", "Opgevolgd"],
        datasets: [
          {
            data: [stats.accepted, stats.rejected, stats.followed],
            backgroundColor: ["#16A34A", "#DC2626", "#2563EB"],
          },
        ],
      },
      options: {
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  function renderMonthChart(requests) {
    const ctx = document.getElementById("monthChart");
    if (!ctx) return;
    if (charts.month) charts.month.destroy();

    const counts = {};
    requests.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts).sort();
    const data = labels.map((k) => counts[k]);

    charts.month = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Aanvragen per maand",
            data,
            backgroundColor: "#4F46E5",
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
      },
    });
  }

  function renderConversionChart(requests) {
    const ctx = document.getElementById("conversionChart");
    if (!ctx) return;
    if (charts.conversion) charts.conversion.destroy();

    const months = {};
    requests.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { total: 0, accepted: 0 };
      months[key].total++;
      if (r.status === "Geaccepteerd") months[key].accepted++;
    });

    const labels = Object.keys(months).sort();
    const percentages = labels.map((k) =>
      months[k].total ? ((months[k].accepted / months[k].total) * 100).toFixed(1) : 0
    );

    charts.conversion = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Acceptatiepercentage (%)",
            data: percentages,
            borderColor: "#16A34A",
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: (v) => `${v}%` },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  /* ============================================================
     📤 CSV-export
  ============================================================ */
  $exportBtn?.addEventListener("click", () => {
    if (!allRequests.length) return showNotif("Geen data om te exporteren.");
    const rows = [
      ["Naam", "E-mail", "Bericht", "Status", "Datum"],
      ...allRequests.map((r) => [
        r.name,
        r.email,
        (r.message || "").replace(/\n/g, " "),
        r.status,
        formatDate(r.createdAt),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aanvragen.csv";
    a.click();
  });

  /* ============================================================
     🚀 Init
  ============================================================ */
  await loadDashboardData();
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
function formatDate(str) {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });
}
