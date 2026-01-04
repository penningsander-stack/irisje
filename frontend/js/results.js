// frontend/js/results.js
// v2026-01-06 FIX-LOAD-MATCHED-COMPANIES

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const container = document.getElementById("resultsContainer");
  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");

  if (!requestId) {
    container.innerHTML = "<p>Geen aanvraag gevonden.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error("Aanvraag niet gevonden");
    }

    titleEl.textContent = "Bedrijven voor jouw aanvraag";
    skeleton.style.display = "none";

    const companies = data.companies || [];

    if (!companies.length) {
      container.innerHTML = "<p>Geen bedrijven gevonden.</p>";
      return;
    }

    container.innerHTML = companies.map(renderCompanyCard).join("");
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    container.innerHTML = "<p>Fout bij laden van bedrijven.</p>";
  }
}

function renderCompanyCard(company) {
  const rating = company.avgRating
    ? company.avgRating.toFixed(1)
    : "—";

  return `
    <div class="surface-card p-5 rounded-2xl shadow-soft">
      <h3 class="font-semibold text-slate-900 mb-1">
        ${escapeHtml(company.name)}
      </h3>
      <div class="text-sm text-slate-600 mb-2">
        ${rating} (${company.reviewCount || 0} reviews)
      </div>
      ${
        company.isVerified
          ? `<span class="badge-verified">Geverifieerd</span>`
          : ""
      }
      <a href="company.html?company=${company._id}"
         class="mt-4 inline-flex justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
        Bekijk bedrijf
      </a>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}
