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
      console.error("Fout bij koppelen beheerder:", err);
    }
  }

  const $reqBody = byId("request-table-body");
  const $revBody = byId("review-table-body");
  const $statusFilter = byId("statusFilter");

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

  // ===================
  // 📬 AANVRAGEN LADEN
  // ===================
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord (requests)");
      allRequests = [...data].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      renderRequestsTable(allRequests);
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      if ($reqBody)
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
      if (!res.ok || !Array.isArray(data)) throw new Error("Ongeldig antwoord (reviews)");
      allReviews = [...data].sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
      );
      renderReviewsTable(allReviews);
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      if ($revBody)
        $revBody.innerHTML =
          "<tr><td colspan='5' class='text-center text-red-600 p-4'>❌ Fout bij laden reviews.</td></tr>";
      allReviews = [];
    }
  }

  // ====================
  // 📄 TABELRENDERERS
  // ====================
  function renderRequestsTable(list) {
    if (!$reqBody) return;
    if (!list?.length) {
      $reqBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      updateStatsAndCharts();
      return;
    }

    $reqBody.innerHTML = list
      .map((req) => {
        const d = new Date(req.createdAt || req.date);
        const datum = !isNaN(d)
          ? d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";
        const status = req.status || "Nieuw";
        return `
          <tr class="border-t hover:bg-indigo-50 transition">
            <td>${esc(req.name)}</td>
            <td>${esc(req.email)}</td>
            <td class="max-w-xs truncate">${esc(req.message)}</td>
            <td>
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
            <td>${datum}</td>
          </tr>`;
      })
      .join("");

    updateStatsAndCharts();
  }

  function renderReviewsTable(list) {
    if (!$revBody) return;
    if (!list?.length) {
      $revBody.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      updateStatsAndCharts();
      return;
    }

    $revBody.innerHTML = list
      .map((rev) => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = !isNaN(d)
          ? d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })
          : "-";
        return `
          <tr class="border-t hover:bg-indigo-50 transition">
            <td>${esc(rev.name)}</td>
            <td>${"⭐".repeat(rev.rating || 0)}</td>
            <td class="max-w-xs truncate">${esc(rev.message)}</td>
            <td>${datum}</td>
            <td>
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

    updateStatsAndCharts();
  }

  // =======================
  // 🚨 REVIEW MELDEN
  // =======================
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

  // ===========================
  // 📊 STATISTIEKEN & GRAFIEKEN
  // ===========================
  let maandChart, statusChart;

  function updateStatsAndCharts() {
    const total = allRequests.length;
    const accepted = allRequests.filter((r) => r.status === "Geaccepteerd").length;
    const rejected = allRequests.filter((r) => r.status === "Afgewezen").length;
    const followedUp = allRequests.filter((r) => r.status === "Opgevolgd").length;

    setText("total", total);
    setText("accepted", accepted);
    setText("rejected", rejected);
    setText("followed-up", followedUp);

    const now = new Date();
    const thisMonthReqs = allRequests.filter((r) =>
      sameMonthYear(new Date(r.createdAt || r.date), now)
    );
    const monthTotal = thisMonthReqs.length;
    const monthAccepted = thisMonthReqs.filter((r) => r.status === "Geaccepteerd").length;
    const thisMonthReviews = allReviews.filter((rv) =>
      sameMonthYear(new Date(rv.createdAt || rv.date), now)
    );
    const monthReviews = thisMonthReviews.length;
    const avgRating = allReviews.length
      ? (allReviews.reduce((s, rv) => s + (rv.rating || 0), 0) / allReviews.length).toFixed(1)
      : "–";

    setText("monthTotal", monthTotal);
    setText("monthAccepted", monthAccepted);
    setText("monthReviews", monthReviews);
    setText("avgRating", avgRating);

    const ctx1 = byId("maandChart");
    const ctx2 = byId("statusChart");
    if (!ctx1 || !ctx2) return;

    const perMaand = {};
    allRequests.forEach((r) => {
      const d = new Date(r.createdAt || r.date);
      if (isNaN(d)) return;
      const key = `${d.toLocaleString("nl-NL", { month: "short" })} ${d.getFullYear()}`;
      perMaand[key] = (perMaand[key] || 0) + 1;
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
            borderColor: "#4F46E5",
            backgroundColor: "rgba(79,70,229,0.2)",
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });

    const statusData = {
      Nieuw: allRequests.filter((r) => !r.status || r.status === "Nieuw").length,
      Geaccepteerd: accepted,
      Afgewezen: rejected,
      Opgevolgd: followedUp,
    };

    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: Object.keys(statusData),
        datasets: [
          {
            data: Object.values(statusData),
            backgroundColor: ["#4F46E5", "#22c55e", "#ef4444", "#eab308"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  // ===================
  // 🔍 FILTEREN
  // ===================
  if ($statusFilter) {
    $statusFilter.addEventListener("change", () => {
      const val = $statusFilter.value;
      const list =
        val === "ALLE"
          ? allRequests
          : allRequests.filter((r) => (r.status || "Nieuw") === val);
      renderRequestsTable(list);
    });
  }

  // ===================
  // 🚪 UITLOGGEN
  // ===================
  const $logout = byId("logoutBtn");
  if ($logout) {
    $logout.addEventListener("click", () => {
      document.body.classList.add("fade-out");
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "login.html";
      }, 600);
    });
  }

  // 🚀 INIT
  await loadRequests();
  await loadReviews();
}

// ===================
// 🧩 HELPERS
// ===================
function byId(id) {
  return document.getElementById(id);
}

function setText(id, val) {
  const el = byId(id);
  if (el) el.textContent = val;
}

function sameMonthYear(a, b) {
  if (!(a instanceof Date) || isNaN(a)) return false;
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function esc(v) {
  if (v == null) return "";
  return String(v).replace(/[&<>"']/g, (s) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
  );
}
