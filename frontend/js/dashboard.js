// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder: bedrijf koppelen op basis van e-mail
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
        updateCharts([]);
        return;
      }

      const rows = data.map((req) => {
        const d = new Date(req.date || req.createdAt).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
          <tr class="border-t">
            <td>${req.name || ""}</td>
            <td>${req.email || ""}</td>
            <td>${req.message || ""}</td>
            <td>${req.status || "Nieuw"}</td>
            <td>${d}</td>
          </tr>`;
      }).join("");

      document.getElementById("request-table-body").innerHTML = rows;

      // Statistieken tellen
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

      updateCharts(data);
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

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map((rev) => {
        const d = new Date(rev.createdAt || rev.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
          <tr class="border-t">
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

  // === Grafieken ===
  let maandChart, statusChart;

  function updateCharts(data) {
    const ctx1 = document.getElementById("maandChart");
    const ctx2 = document.getElementById("statusChart");

    if (!ctx1 || !ctx2) return;

    const maanden = Array(12).fill(0);
    data.forEach(r => {
      const m = new Date(r.date || r.createdAt).getMonth();
      maanden[m]++;
    });

    const statusData = {
      Nieuw: data.filter(r => r.status === "Nieuw").length,
      Geaccepteerd: data.filter(r => r.status === "Geaccepteerd").length,
      Afgewezen: data.filter(r => r.status === "Afgewezen").length,
    };

    // Verwijder oude grafieken
    if (maandChart) maandChart.destroy();
    if (statusChart) statusChart.destroy();

    // Balkgrafiek (aanvragen per maand)
    maandChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: [
          "Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
          "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"
        ],
        datasets: [{
          label: "Aanvragen per maand",
          data: maanden,
          backgroundColor: "rgba(79, 70, 229, 0.7)",
        }],
      },
      options: { scales: { y: { beginAtZero: true } } }
    });

    // Donutgrafiek (statussen)
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusData),
        datasets: [{
          data: Object.values(statusData),
          backgroundColor: ["#6b7280", "#22c55e", "#ef4444"],
        }],
      },
      options: { plugins: { legend: { position: "bottom" } } }
    });
  }

  // === Uitloggen ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // === Initial Load ===
  await loadRequests();
  await loadReviews();

  // Automatisch verversen elke 30 seconden
  setInterval(loadRequests, 30000);
});
