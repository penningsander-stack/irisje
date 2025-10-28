// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder: bedrijven ophalen via owner
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();

      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
        console.log("Beheerder gekoppeld aan bedrijf:", ownerData[0].name);
      } else {
        console.warn("Geen bedrijven gevonden voor beheerder.");
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
        return;
      }

      const rows = data.map((req) => {
        const d = req.createdAt
          ? new Date(req.createdAt).toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";
        return (
          "<tr class='border-t'>" +
          "<td>" + (req.name || "") + "</td>" +
          "<td>" + (req.email || "") + "</td>" +
          "<td>" + (req.message || "") + "</td>" +
          "<td>" + (req.status || "Nieuw") + "</td>" +
          "<td>" + d + "</td>" +
          "</tr>"
        );
      }).join("");

      document.getElementById("request-table-body").innerHTML = rows;

      // Statistieken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

      // === Grafieken updaten ===
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
        const d = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";
        return (
          "<tr class='border-t'>" +
          "<td>" + (rev.name || "") + "</td>" +
          "<td>" + "⭐".repeat(rev.rating || 0) + "</td>" +
          "<td>" + (rev.message || "") + "</td>" +
          "<td>" + d + "</td>" +
          "</tr>"
        );
      }).join("");

      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === Grafieken genereren ===
  let maandChart, statusChart;

  function updateCharts(data) {
    const ctx1 = document.getElementById("maandChart");
    const ctx2 = document.getElementById("statusChart");

    if (!ctx1 || !ctx2) return;

    const perMaand = {};
    data.forEach((r) => {
      const maand = new Date(r.createdAt).toLocaleString("nl-NL", { month: "short" });
      perMaand[maand] = (perMaand[maand] || 0) + 1;
    });

    const labels = Object.keys(perMaand);
    const values = Object.values(perMaand);

    if (maandChart) maandChart.destroy();
    maandChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Aanvragen",
          data: values,
          borderColor: "#4F46E5",
          backgroundColor: "rgba(79,70,229,0.2)",
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    const statusData = {
      Geaccepteerd: data.filter(r => r.status === "Geaccepteerd").length,
      Afgewezen: data.filter(r => r.status === "Afgewezen").length,
      Nieuw: data.filter(r => !["Geaccepteerd", "Afgewezen"].includes(r.status)).length,
    };

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusData),
        datasets: [{
          data: Object.values(statusData),
          backgroundColor: ["#22c55e", "#ef4444", "#eab308"]
        }]
      },
      options: { responsive: true, plugins: { legend: { position: "bottom" } } }
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
