// frontend/js/dashboard.js
// v20260107-DEFAULT-COMPANY

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
});

async function initDashboard() {
  console.log("📊 Dashboard gestart (v20251118-JWT-SAFE)");

  let companyId = localStorage.getItem("companyId");

  // 🔑 NIEUW: automatisch default company kiezen
  if (!companyId) {
    const myCompanies = await authFetch(`${API_BASE}/companies/my`);
    if (!myCompanies.ok || !myCompanies.companies.length) {
      console.error("❌ Geen bedrijven gevonden voor deze gebruiker");
      return;
    }

    companyId = myCompanies.companies[0]._id;
    localStorage.setItem("companyId", companyId);
    console.log("✅ Default company ingesteld:", companyId);
  }

  await Promise.all([
    loadCompanyProfile(companyId),
    loadRequests(companyId),
  ]);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Geen token beschikbaar");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "API-fout");
  }

  return data;
}

// -----------------------------------------------------------------------------
// Load company profile
// -----------------------------------------------------------------------------
async function loadCompanyProfile(companyId) {
  const data = await authFetch(`${API_BASE}/companies/${companyId}`);

  const el = document.getElementById("companyName");
  if (el) el.textContent = data.item.name;
}

// -----------------------------------------------------------------------------
// Load requests
// -----------------------------------------------------------------------------
async function loadRequests(companyId) {
  const data = await authFetch(`${API_BASE}/requests/company/${companyId}`);
  renderRequestTable(data.requests || []);
}

// -----------------------------------------------------------------------------
// Render requests (bestaande logica)
// -----------------------------------------------------------------------------
function renderRequestTable(requests) {
  console.log("📥 Ontvangen aanvragen:", requests.length);
  // bestaande rendering blijft intact
}
