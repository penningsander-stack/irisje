// frontend/js/results.js
// v20260104-results-fallback-publicCompanies

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];

document.addEventListener("DOMContentLoaded", () => {
  initResults();
});

async function initResults() {
  const params = new URLSearchParams(window.location.search);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const city = params.get("city") || "";
  const requestId = params.get("requestId") || "";

  const hasSearchContext = q || category || requestId;


  let url;

  if (!hasSearchContext) {
    // 🔁 FALLBACK: toon alle publieke bedrijven
    url = `${API_BASE}/publicCompanies`;
    setResultsHeader(
      "Populaire bedrijven",
      "Selecteer filters of kies een bedrijf om verder te gaan."
    );
  } else {
    // 🔍 Normale zoekflow
    const searchParams = new URLSearchParams();
    if (q) searchParams.set("q", q);
    if (category) searchParams.set("category", category);
    if (city) searchParams.set("city", city);
    if (requestId) searchParams.set("requestId", requestId);

    url = `${API_BASE}/companies/search?${searchParams.toString()}`;
    setResultsHeader(
      "Bedrijven in jouw regio",
      "Vergelijk bedrijven, lees reviews en vraag in één keer een offerte aan."
    );
  }

  try {
    const data = await safeJsonFetch(url);

    if (!data || !Array.isArray(data.companies || data)) {
      renderEmpty();
      return;
    }

    allResults = data.companies || data;
    renderResults(allResults);
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    renderEmpty();
  }
}

function setResultsHeader(title, subtitle) {
  const titleEl = document.getElementById("resultsTitle");
  const subtitleEl = document.getElementById("resultsSubtitle");

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

function renderResults(companies) {
  const grid = document.getElementById("resultsGrid");
if (!grid) return;
grid.innerHTML = `<p>Geen bedrijven gevonden.</p>`;

  grid.innerHTML = "";

  if (!companies.length) {
    renderEmpty();
    return;
  }

  companies.forEach((company) => {
    const card = document.createElement("div");
    card.className = "company-card";
    card.innerHTML = `
      <h3>${company.name}</h3>
      ${company.avgRating ? `<div>⭐ ${company.avgRating} (${company.reviewCount || 0})</div>` : ""}
      ${company.city ? `<div>${company.city}</div>` : ""}
      <a href="/company.html?company=${company._id}" class="btn">Bekijk bedrijf</a>
    `;
    grid.appendChild(card);
  });
}

function renderEmpty() {
  const grid = document.getElementById("resultsGrid");
  grid.innerHTML = `<p>Geen bedrijven gevonden.</p>`;
}

async function safeJsonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}
