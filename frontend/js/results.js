// frontend/js/results.js
// v2026-01-07 FIX-MATCHED-COMPANIES-SAFE

const API_BASE = "https://irisje-backend.onrender.com/api";

let allCompanies = [];

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  if (!requestId) {
    container.innerHTML =
      `<div class="text-center text-slate-500 py-12">
        Geen aanvraag gevonden.
       </div>`;
    return;
  }

  try {
    // 1️⃣ aanvraag ophalen (alleen om te checken of hij bestaat)
    const reqRes = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const reqData = await reqRes.json();

    if (!reqRes.ok || !reqData.ok) {
      throw new Error("Aanvraag niet gevonden");
    }

    titleEl.textContent = "Bedrijven voor jouw aanvraag";

    // 2️⃣ bedrijven ophalen die bij deze aanvraag horen
    const compRes = await fetch(
      `${API_BASE}/publicCompanies?requestId=${encodeURIComponent(requestId)}`
    );
    const compData = await compRes.json();

    if (!compRes.ok || !compData.ok) {
      throw new Error("Bedrijven ophalen mislukt");
    }

    allCompanies = Array.isArray(compData.companies)
      ? compData.companies
      : [];

    skeleton.style.display = "none";
    renderCompanies(allCompanies);
  } catch (err) {
    console.error("❌ results load error:", err);
    skeleton.style.display = "none";
    renderEmpty();
  }
}

function renderCompanies(companies) {
  const container = document.getElementById("resultsContainer");

  if (!companies.length) {
    renderEmpty();
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
        href="company.html?company=${company._id}"
        class="mt-4 inline-flex justify-center px-4 py-2 rounded-xl
               bg-indigo-600 text-white text-sm font-medium
               hover:bg-indigo-700"
      >
        Bekijk bedrijf
      </a>
    </div>
  `;
}

function renderEmpty() {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = `
    <div class="col-span-full text-center text-slate-500 py-12">
      Geen bedrijven gevonden voor deze aanvraag.
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
