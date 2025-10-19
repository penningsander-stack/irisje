// frontend/js/dashboard_safe.js
// Dashboard – uitgebreid: grafiek, filter en 'Meld review' (visueel)
// Laat backend ongemoeid. Werkt met /api/requests/company en /api/reviews/company.

console.log("📊 Dashboard Safe Script geladen");

const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
const token = localStorage.getItem("token");

if (!token) {
  console.warn("⚠️ Geen token gevonden — terug naar login");
  window.location.href = "login.html";
}

let allRequests = [];
let statusChart;

/** Utility */
const byId = (id) => document.getElementById(id);

/** Status badge helper */
function statusBadge(status) {
  const s = (status || "Nieuw").toLowerCase();
  const map = {
    "nieuw": "status-nieuw",
    "geaccepteerd": "status-geaccepteerd",
    "afgewezen": "status-afgewezen",
    "opgevolgd": "status-opgevolgd",
  };
  const cls = map[s] || "status-nieuw";
  return `<span class="status-badge ${cls}">${status || "Nieuw"}</span>`;
}

/** Chart setup */
function ensureChart(ctx, counts) {
  const data = {
    labels: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
    datasets: [{
      label: "Aantal aanvragen",
      data: [counts.nieuw, counts.geaccepteerd, counts.afgewezen, counts.opgevolgd],
      borderWidth: 1
    }]
  };
  const opts = {
    responsive: true,
    scales: { y: { beginAtZero: true, precision: 0 } },
    plugins: { legend: { display: false } }
  };

  if (!statusChart) {
    statusChart = new Chart(ctx, { type: "bar", data, options: opts });
  } else {
    statusChart.data = data;
    statusChart.update();
  }
}

/** Statistieken op kaarten + chart */
function updateStats(requests) {
  const total = requests.length;
  const nieuw = requests.filter(r => r.status === "Nieuw").length;
  const geaccepteerd = requests.filter(r => r.status === "Geaccepteerd").length;
  const afgewezen = requests.filter(r => r.status === "Afgewezen").length;
  const opgevolgd = requests.filter(r => r.status === "Opgevolgd").length;

  byId("statTotal").textContent = total;
  byId("statAccepted").textContent = geaccepteerd;
  byId("statRejected").textContent = afgewezen;
  byId("statFollowed").textContent = opgevolgd;

  const ctx = byId("statusChart").getContext("2d");
  ensureChart(ctx, { nieuw, geaccepteerd, afgewezen, opgevolgd });
}

/** Veilige fetch -> JSON of [] */
async function safeFetch(url, headers) {
  try {
    const res = await fetch(url, { headers });
    const txt = await res.text();
    console.log("🔍 Response", url, "=", txt);
    try {
      return JSON.parse(txt);
    } catch (e) {
      console.warn("❌ Ongeldige JSON:", e);
      return [];
    }
  } catch (err) {
    console.error("❌ Fout bij fetch:", err);
    return [];
  }
}

/** Render aanvragen */
function renderRequests(list) {
  const tbody = byId("requestsBody");
  if (!tbody) return;

  if (!list?.length) {
    tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td>${r.name || "-"}</td>
      <td>${r.email || "-"}</td>
      <td>${r.message || "-"}</td>
      <td>${statusBadge(r.status)}</td>
      <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
    </tr>
  `).join("");
}

/** Render reviews (met visuele meldknop) */
function renderReviews(list) {
  const tbody = byId("reviewsBody");
  if (!tbody) return;

  if (!list?.length) {
    tbody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr data-review-id="${r._id}">
      <td>${r.name || "-"}</td>
      <td>${"⭐".repeat(Number(r.rating) || 0)}</td>
      <td>${r.message || "-"}</td>
      <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
      <td><button class="btn btn-report" data-action="report">Melden</button></td>
    </tr>
  `).join("");

  // Event delegation voor meldknoppen (alleen visueel)
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action="report"]');
    if (!btn) return;
    const tr = btn.closest("tr");
    const reviewId = tr?.getAttribute("data-review-id") || "(onbekend)";

    // Visuele feedback (zonder backend)
    btn.textContent = "Gemeld";
    btn.disabled = true;
    console.log("ℹ️ Review gemeld (visueel):", reviewId);
    alert("Review gemeld. Bedankt! (demomodus – geen backendwijziging)");
  }, { once: true });
}

/** Init */
document.addEventListener("DOMContentLoaded", async () => {
  // Bedrijfsgegevens tonen
  let company = {};
  try {
    const raw = localStorage.getItem("company");
    company = raw && raw !== "undefined" ? JSON.parse(raw) : {};
  } catch { company = {}; }

  const nameEl = byId("companyName");
  const emailEl = byId("companyEmail");
  const catEl = byId("category");
  const lastLoginEl = byId("lastLogin");

  if (nameEl) nameEl.textContent = company.name || "Demo Bedrijf";
  if (emailEl) emailEl.textContent = company.email || "demo@irisje.nl";
  if (catEl) catEl.textContent = company.category || "Algemeen";
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

  // Uitloggen
  const logoutBtn = byId("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      console.log("👋 Uitgelogd");
      window.location.href = "login.html";
    });
  }

  // Data ophalen
  const headers = { Authorization: `Bearer ${token}` };
  const requests = await safeFetch(`${API_BASE}/api/requests/company`, headers);
  const reviews = await safeFetch(`${API_BASE}/api/reviews/company`, headers);

  allRequests = Array.isArray(requests) ? requests : [];
  renderRequests(allRequests);
  updateStats(allRequests);

  renderReviews(Array.isArray(reviews) ? reviews : []);

  // Filter
  const filterEl = byId("filter");
  if (filterEl) {
    filterEl.addEventListener("change", (e) => {
      const v = e.target.value;
      if (v === "Alle") {
        renderRequests(allRequests);
        updateStats(allRequests);
      } else {
        const filtered = allRequests.filter(r => (r.status || "").toLowerCase() === v.toLowerCase());
        renderRequests(filtered);
        updateStats(filtered);
      }
    });
  }

  console.log("✅ Dashboard geladen met grafiek, filter en meldknoppen (visueel)");
});
