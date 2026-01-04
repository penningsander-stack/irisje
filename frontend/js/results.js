// frontend/js/results.js
// v2026-01-07 FIX-304-CACHE + STABLE-RENDER

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const titleEl = document.getElementById("resultsTitle");
  const container = document.getElementById("resultsContainer");
  const skeleton = document.getElementById("resultsSkeleton");

  if (!container) {
    console.error("❌ resultsContainer niet gevonden");
    return;
  }

  if (!requestId) {
    container.innerHTML = "<p>Geen aanvraag gevonden.</p>";
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`,
      {
        cache: "no-store",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.ok !== true || !Array.isArray(data.companies)) {
      throw new Error("Ongeldige response");
    }

    if (titleEl) {
      titleEl.textContent = "Bedrijven voor jouw aanvraag";
    }

    if (skeleton) {
      skeleton.style.display = "none";
    }

    renderCompanies(data.companies);
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    if (skeleton) skeleton.style.display = "none";
    container.innerHTML =
      "<p>Er ging iets mis bij het laden van de bedrijven.</p>";
  }
}

function renderCompanies(companies) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  if (!companies.length) {
    container.innerHTML =
      "<p>Geen bedrijven gevonden voor deze aanvraag.</p>";
    return;
  }

  container.innerHTML = companies.map(renderCompanyCard).join("");
}

function renderCompanyCard(company) {
  const rating =
    typeof company.avgRating === "number"
      ? company.avgRating.toFixed(1)
      : "—";
  const reviews = company.reviewCount || 0;

  return `
    <div class="surface-card p-5 rounded-2xl shadow-soft flex flex-col justify-between">
      <div>
        <h3 class="font-semibold text-slate-900 mb-1">
          ${escapeHtml(company.name)}
        </h3>
        <div class="text-sm text-slate-600 mb-2">
          ${rating} (${reviews} reviews)
        </div>
        ${
          company.isVerified
            ? `<span class="badge-verified">Geverifieerd</span>`
            : ``
        }
      </div>
      <a
        href="company.html?company=${encodeURIComponent(company._id)}"
        class="mt-4 inline-flex justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        Bekijk bedrijf
      </a>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[s]));
}
