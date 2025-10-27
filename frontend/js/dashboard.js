// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder koppelen aan bedrijf (fallback)
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const res = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.length > 0) {
        companyId = data[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    return;
  }

  // === AANVRAGEN LADEN ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("request-table-body").innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
        updateCharts([]);
        return;
      }

      // Tabel vullen
      const rows = data.map((req) => {
        const d = req.createdAt
          ? new Date(req.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";
        return `
          <tr class='border-t'>
            <td>${req.name || ""}</td>
            <td>${req.email || ""}</td>
            <td>${req.message || ""}</td>
            <td>${req.status || "Nieuw"}</td>
            <td>${d}</td>
          </tr>`;
      }).join("");
      document.getElementById("request-table-body").innerHTML = rows;

      // Statistieken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

      // Grafieken updaten
      updateCharts(data);
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
    }
  }

  // === REVIEWS LADEN ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map((rev) => {
        const d = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";
        return `
          <tr class='border-t'>
            <td>${rev.name || ""}</td>
            <td>${"⭐".repeat(rev.rating || 0)}</td>
            <td>${rev.message || ""}</td>
            <td>${d}</td>
          </tr>`;
      }).join("");
      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === GRAFIEKEN ===
  let maandChart, statusChart;

  function updateCharts(data) {
    // Verwijder oude grafieken
    if (maandChart) maandChart.destroy();
    if (statusChart) statusChart.destroy();

    // Aantal per maand
    const maanden = Array(12).fill(0);
    data.forEach((r) => {
      if (r.createdAt) {
        const m = new Date(r.createdAt).getMonth();
        maanden[m]++;
      }
    });
    const maandLabels = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

    const ctx1 = document.getElementById("requestsPerMonthChart");
    if (ctx1) {
      maandChart = new Chart(ctx1, {
        type: "bar",
        data: {
          labels: maandLabels,
          datasets: [{
            label: "Aanvragen",
            data: maanden,
            backgroundColor: "rgba(79,70,229,0.5)",
            borderColor: "rgba(79,70,229,0.9)",
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 18
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: "#555" }
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#555" },
              grid: { color: "rgba(0,0,0,0.05)" }
            }
          },
          animation: {
            duration: 800,
            easing: "easeOutQuart"
          }
        }
      });
    }

    // Statusverdeling
    const statusCounts = {
      Nieuw: 0,
      Geaccepteerd: 0,
      Afgewezen: 0,
      Opgevolgd: 0
    };
    data.forEach(r => {
      if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;
    });

    const ctx2 = document.getElementById("statusDistributionChart");
    if (ctx2) {
      statusChart = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(99,102,241,0.8)", // indigo
              "rgba(34,197,94,0.8)",  // groen
              "rgba(239,68,68,0.8)",  // rood
              "rgba(245,158,11,0.8)"  // oranje
            ],
            borderColor: "white",
            borderWidth: 2
          }]
        },
        options: {
          cutout: "70%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#444", boxWidth: 12 }
            }
          },
          animation: {
            animateScale: true,
            duration: 900,
            easing: "easeOutElastic"
          }
        }
      });
    }
  }

  // === FILTER ===
  document.getElementById("statusFilter").addEventListener("change", async (e) => {
    const status = e.target.value;
    const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
    const data = await res.json();
    const filtered = status ? data.filter(r => r.status === status) : data;
    updateCharts(filtered);
  });

  // === VERNIEUW ===
  document.getElementById("refreshBtn").addEventListener("click", loadRequests);

  // === UITLOGGEN ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // INIT
  await loadRequests();
  await loadReviews();
});
