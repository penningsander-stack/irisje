// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder koppelen aan bedrijf
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
    return;
  }

  // === Grafiek objecten ===
  let maandChart, statusChart;

  function createCharts(requests) {
    const maanden = Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString("nl-NL", { month: "short" })
    );
    const perMaand = new Array(12).fill(0);
    const statusCount = { Nieuw: 0, Geaccepteerd: 0, Afgewezen: 0, Opgevolgd: 0 };

    requests.forEach((r) => {
      const d = new Date(r.date || r.createdAt);
      if (!isNaN(d)) perMaand[d.getMonth()]++;
      statusCount[r.status] = (statusCount[r.status] || 0) + 1;
    });

    const maandCtx = document.getElementById("maandChart");
    const statusCtx = document.getElementById("statusChart");

    if (maandChart) maandChart.destroy();
    if (statusChart) statusChart.destroy();

    // 📊 Balkgrafiek
    maandChart = new Chart(maandCtx, {
      type: "bar",
      data: {
        labels: maanden,
        datasets: [
          {
            label: "Aanvragen",
            data: perMaand,
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

    // 🍩 Donutgrafiek
    statusChart = new Chart(statusCtx, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusCount),
        datasets: [
          {
            data: Object.values(statusCount),
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

  // === Aanvragen laden ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Ongeldige data");
      }

      if (data.length === 0) {
        document.getElementById("request-table-body").innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      } else {
        const rows = data
          .map((req) => {
            const d = new Date(req.date || req.createdAt);
            const datum = !isNaN(d)
              ? d.toLocaleDateString("nl-NL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "-";
            return `
              <tr class="border-t">
                <td>${req.name || ""}</td>
                <td>${req.email || ""}</td>
                <td>${req.message || ""}</td>
                <td>${req.status || "Nieuw"}</td>
                <td>${datum}</td>
              </tr>`;
          })
          .join("");
        document.getElementById("request-table-body").innerHTML = rows;
      }

      // Statistieken bijwerken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter((r) => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter((r) => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter((r) => r.status === "Opgevolgd").length;

      // Grafieken aanmaken of verversen
      createCharts(data);
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
    }
  }

  // === Reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldige data");

      if (data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      } else {
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
              <tr class="border-t">
                <td>${rev.name || ""}</td>
                <td>${"⭐".repeat(rev.rating || 0)}</td>
                <td>${rev.message || ""}</td>
                <td>${datum}</td>
              </tr>`;
          })
          .join("");
        document.getElementById("review-table-body").innerHTML = rows;
      }
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === Uitloggen ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // === Init ===
  await loadRequests();
  await loadReviews();
});
