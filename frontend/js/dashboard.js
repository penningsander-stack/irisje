// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder fallback
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
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  let allRequests = [];

  // === Aanvragen laden ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord van server (requests)");
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

  function renderRequestsTable(requestsToShow) {
    if (!requestsToShow || requestsToShow.length === 0) {
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      return;
    }

    const rows = requestsToShow.map(req => {
      const d = new Date(req.createdAt || req.date);
      const datum = isNaN(d)
        ? "-"
        : d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
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

  // === Reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord van server (reviews)");

      if (data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map(rev => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = isNaN(d)
          ? "-"
          : d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
        return `
          <tr class="border-t hover:bg-indigo-50 transition">
            <td>${rev.name || ""}</td>
            <td>${"⭐".repeat(rev.rating || 0)}</td>
            <td>${rev.message || ""}</td>
            <td>${datum}</td>
            <td>
              ${
                rev.reported
                  ? `<span class="text-xs text-gray-500 italic">Gemeld</span>`
                  : `<button onclick="meldReview('${rev._id}')"
                      class="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                      Melden
                    </button>`
              }
            </td>
          </tr>`;
      }).join("");
      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === Review melden ===
  window.meldReview = async function(id) {
    if (!confirm("Weet je zeker dat je deze review wilt melden aan de beheerder?")) return;
    try {
      const res = await fetch(`${API_BASE}/reviews/report/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      alert("✅ Review is gemeld aan de beheerder.");
      loadReviews(); // lijst verversen
    } catch (err) {
      console.error("Fout bij melden review:", err);
      alert("❌ Er ging iets mis bij het melden van de review.");
    }
  };

  // === Statistieken updaten ===
  function updateStats(list) {
    document.getElementById("total").textContent = list.length;
    document.getElementById("accepted").textContent = list.filter(r => r.status === "Geaccepteerd").length;
    document.getElementById("rejected").textContent = list.filter(r => r.status === "Afgewezen").length;
    document.getElementById("followed-up").textContent = list.filter(r => r.status === "Opgevolgd").length;
  }

  // === Grafieken ===
  let maandChart, statusChart;
  function updateCharts(list) {
    const ctx1 = document.getElementById("maandChart");
    const ctx2 = document.getElementById("statusChart");
    if (!ctx1 || !ctx2) return;
    const perMaand = {};
    list.forEach(r => {
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
      data: { labels, datasets: [{ label: "Aanvragen", data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79,70,229,0.2)", fill: true, tension: 0.4 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    const statusData = {
      Nieuw: list.filter(r => r.status === "Nieuw" || !r.status).length,
      Geaccepteerd: list.filter(r => r.status === "Geaccepteerd").length,
      Afgewezen: list.filter(r => r.status === "Afgewezen").length,
      Opgevolgd: list.filter(r => r.status === "Opgevolgd").length,
    };
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: { labels: Object.keys(statusData), datasets: [{ data: Object.values(statusData), backgroundColor: ["#4F46E5", "#22c55e", "#ef4444", "#eab308"] }] },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
    });
  }

  // === Uitloggen ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    document.body.classList.add("fade-out");
    setTimeout(() => {
      localStorage.clear();
      window.location.href = "login.html";
    }, 600);
  });

  await loadRequests();
  await loadReviews();
});
