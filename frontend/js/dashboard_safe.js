// frontend/js/dashboard_safe.js
console.log("📊 Dashboard Safe Script geladen");

const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

// ✅ Controleer token
const token = localStorage.getItem("token");
if (!token) {
  console.warn("⚠️ Geen token gevonden — terug naar login");
  window.location.href = "login.html";
}

// ✅ Logout knop koppelen
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      console.log("👋 Uitgelogd");
      window.location.href = "login.html";
    });
  }

  laadDashboardData();
});

// ✅ Functie om data op te halen
async function laadDashboardData() {
  try {
    const headers = { Authorization: `Bearer ${token}` };

    // ---- Aanvragen ophalen ----
    const reqRes = await fetch(`${API_BASE}/api/requests/company`, { headers });
    const reqText = await reqRes.text();
    console.log("📬 Ruwe response aanvragen:", reqText);

    let requests = [];
    try {
      requests = JSON.parse(reqText);
    } catch (err) {
      console.error("❌ Ongeldige JSON in aanvragen:", err);
    }
    toonAanvragen(requests);

    // ---- Reviews ophalen ----
    const revRes = await fetch(`${API_BASE}/api/reviews/company`, { headers });
    const revText = await revRes.text();
    console.log("💬 Ruwe response reviews:", revText);

    let reviews = [];
    try {
      reviews = JSON.parse(revText);
    } catch (err) {
      console.error("❌ Ongeldige JSON in reviews:", err);
    }
    toonReviews(reviews);

    console.log("✅ Dashboard geladen zonder crash");

  } catch (error) {
    console.error("💥 Dashboard-fout:", error);
  }
}

// ✅ Tabel met aanvragen vullen
function toonAanvragen(requests) {
  const tbody = document.getElementById("requestsBody");
  if (!tbody) return;

  if (!requests || requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests.map(r => `
    <tr>
      <td>${r.name || "-"}</td>
      <td>${r.email || "-"}</td>
      <td>${r.message || "-"}</td>
      <td>${r.status || "-"}</td>
      <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
    </tr>
  `).join("");
}

// ✅ Reviews vullen
function toonReviews(reviews) {
  const tbody = document.getElementById("reviewsBody");
  if (!tbody) return;

  if (!reviews || reviews.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Geen reviews gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews.map(r => `
    <tr>
      <td>${r.name || "-"}</td>
      <td>${r.rating ? "⭐".repeat(r.rating) : "-"}</td>
      <td>${r.message || "-"}</td>
      <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
    </tr>
  `).join("");
}
