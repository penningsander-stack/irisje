// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder fallback: bedrijf ophalen via owner-email
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();

      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.error("Fout bij koppelen beheerder:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    document.getElementById("review-table-body").innerHTML =
      "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  // We houden alle aanvragen hier in geheugen
  let allRequests = [];

  // ========== AANVRAGEN LADEN ==========
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Ongeldig antwoord van server (requests)");
      }

      allRequests = data;
      renderRequestsTable(allRequests);
      updateStats(allRequests);
      updateCharts(allRequests);
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
      updateStats([]);
      updateCharts([]);
    }
  }

  // ========== TABEL RENDEREN (AANVRAGEN) ==========
  function renderRequestsTable(requestsToShow) {
    if (!requestsToShow || requestsToShow.length === 0) {
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden voor deze filter.</td></tr>";
      return;
    }

    const rows = requestsToShow.map(req => {
      const d = new Date(req.createdAt || req.date);
      const datum = isNaN(d)
        ? "-"
        : d.toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

      return `
        <tr class="border-t hover:bg-indigo-50 transition">
          <td>${req.name || ""}</td>
          <td>${req.email || ""}</td>
          <td>${req.message || ""}</td>
          <td>${req.status || "Nieuw"}</td>
          <td>${datum}</td>
        </tr>`;
    }).join("");

    document.getElementById("request-table-body").innerHTML = rows;
  }

  // ========== REVIEWS LADEN ==========
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Ongeldig antwoord van server (reviews)");
      }

      if (data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map(rev => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = isNaN(d)
          ? "-"
          : d.toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

        return `
          <tr class="border-t hover:bg-indigo-50 transition">
            <td>${rev.name || ""}</td>
            <td>${"⭐".repeat(rev.rating || 0)}</td>
            <td>${rev.message || ""}</td>
            <td>${datum}</td>
          </tr>`;
      }).join("");

      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // ========== STATISTIEKEN UPDATEN ==========
  function updateStats(list) {
    document.getElementById("total").textContent = list.length;
    document.getElementById("accepted").textContent = list.filter(r => r.status === "Geaccepteerd").length;
    document.getElementById("rejected").textContent = list.filter(r => r.status === "Afgewezen").length;
    document.getElementById("followed-up").textContent = list.filter(r => r.status === "Opgevolgd").length;
  }

  // ========== GRAFIEKEN ==========
  let maandChart, statusChart;

  function updateCharts(list) {
    const ctx1 = document.getElementById("maandChart");
    const ctx2 = document.getElementById("statusChart");
    if (!ctx1 || !ctx2) return;

    // 1️⃣ Linechart: aanvragen per maand
    const perMaand = {};
    list.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (isNaN(d)) return;
      const maand = d.toLocaleString("nl-NL", { month: "short" });
      perMaand[maand] = (perMaand[maand] || 0) + 1;
    });

    const labels = Object.keys(perMaand);
    const values = Object.values(perMaand);

    if (maandChart) maandChart.destroy();
    maandChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Aanvragen",
            data: values,
            borderColor: "rgba(99,102,241,1)", // indigo-500
            backgroundColor: "rgba(99,102,241,0.15)", // zachte paarse gloed
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: "rgba(99,102,241,0.9)",
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
        },
      },
    });

    // 2️⃣ Donutchart: verdeling per status
    const statusData = {
      Nieuw: list.filter(r => r.status === "Nieuw" || !r.status).length,
      Geaccepteerd: list.filter(r => r.status === "Geaccepteerd").length,
      Afgewezen: list.filter(r => r.status === "Afgewezen").length,
      Opgevolgd: list.filter(r => r.status === "Opgevolgd").length,
    };

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusData),
        datasets: [
          {
            data: Object.values(statusData),
            backgroundColor: [
              "rgba(99,102,241,0.85)",  // Nieuw – indigo
              "rgba(34,197,94,0.8)",    // Geaccepteerd – zacht groen
              "rgba(239,68,68,0.8)",    // Afgewezen – zacht rood
              "rgba(250,204,21,0.8)",   // Opgevolgd – warm geel
            ],
            borderColor: "rgba(255,255,255,1)",
            borderWidth: 2,
          },
        ],
      },
      options: {
        cutout: "70%",
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  // ========== FILTER HANDLER ==========
  const statusSelect = document.getElementById("statusFilter");
  if (statusSelect) {
    statusSelect.addEventListener("change", () => {
      const value = statusSelect.value;
      let filtered = allRequests;

      if (value !== "ALLE") {
        filtered = allRequests.filter(r => (r.status || "Nieuw") === value);
      }

      renderRequestsTable(filtered);
      updateStats(filtered);
      updateCharts(filtered);
    });
  }

  // ========== UITLOGGEN met fade-out ==========
  document.getElementById("logoutBtn").addEventListener("click", () => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "login.html";
    }, 600);
  });

  // INIT
  await loadRequests();
  await loadReviews();
});
