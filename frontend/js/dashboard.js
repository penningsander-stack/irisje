// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder: bedrijf koppelen
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();
      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
        console.log("Beheerder gekoppeld aan bedrijf:", ownerData[0].name);
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven voor beheerder:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    document.getElementById("review-table-body").innerHTML =
      "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  // === Aanvragen laden ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("request-table-body").innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
        // Statistieken leeg
        document.getElementById("total").textContent = 0;
        document.getElementById("accepted").textContent = 0;
        document.getElementById("rejected").textContent = 0;
        document.getElementById("followed-up").textContent = 0;
        // Grafieken met lege data
        updateCharts([]);
        return;
      }

      const rows = data
        .map((req) => {
          const d = new Date(req.createdAt || req.date);
          const datum = !isNaN(d)
            ? d.toLocaleDateString("nl-NL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-";

          return `
            <tr class="border-t hover:bg-gray-50 transition">
              <td>${req.name || ""}</td>
              <td>${req.email || ""}</td>
              <td>${req.message || ""}</td>
              <td>${req.status || "Nieuw"}</td>
              <td>${datum}</td>
            </tr>`;
        })
        .join("");

      document.getElementById("request-table-body").innerHTML = rows;

      // Statistieken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

      // Grafieken
      updateCharts(data);

    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";

      // Statistieken fallback
      document.getElementById("total").textContent = 0;
      document.getElementById("accepted").textContent = 0;
      document.getElementById("rejected").textContent = 0;
      document.getElementById("followed-up").textContent = 0;

      // Grafieken fallback
      updateCharts([]);
    }
  }

  // === Reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data
        .map((rev) => {
          const d = new Date(rev.createdAt || rev.date);
          const datum = !isNaN(d)
            ? d.toLocaleDateString("nl-NL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "-";

          return `
            <tr class="border-t hover:bg-gray-50 transition">
              <td>${rev.name || ""}</td>
              <td>${"⭐".repeat(rev.rating || 0)}</td>
              <td>${rev.message || ""}</td>
              <td>${datum}</td>
            </tr>`;
        })
        .join("");

      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === Grafieken ===
  let maandChart, statusChart;

  function updateCharts(data) {
    const ctx1 = document.getElementById("maandChart");
    const ctx2 = document.getElementById("statusChart");
    if (!ctx1 || !ctx2) return;

    // Aantal aanvragen per maand
    const perMaandMap = {}; // { "okt": 5, "nov": 2, ... }
    data.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (isNaN(d)) return;
      const maand = d.toLocaleString("nl-NL", { month: "short" });
      perMaandMap[maand] = (perMaandMap[maand] || 0) + 1;
    });

    const maandLabels = Object.keys(perMaandMap);
    const maandValues = Object.values(perMaandMap);

    if (maandChart) maandChart.destroy();
    maandChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: maandLabels,
        datasets: [
          {
            label: "Aanvragen",
            data: maandValues,
            backgroundColor: "#4F46E5",
            borderRadius: 6,
          },
        ],
      },
      options: {
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });

    // Verdeling per status
    const statusData = {
      Nieuw: data.filter(r => r.status === "Nieuw" || !r.status).length,
      Geaccepteerd: data.filter(r => r.status === "Geaccepteerd").length,
      Afgewezen: data.filter(r => r.status === "Afgewezen").length,
      Opgevolgd: data.filter(r => r.status === "Opgevolgd").length,
    };

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusData),
        datasets: [
          {
            data: Object.values(statusData),
            backgroundColor: ["#4F46E5", "#16A34A", "#DC2626", "#EAB308"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "70%",
        animation: {
          duration: 1000,
          easing: "easeOutBounce",
        },
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  // === Uitloggen met fade-out ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "login.html";
    }, 600);
  });

  // Init
  await loadRequests();
  await loadReviews();
});
