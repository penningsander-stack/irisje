// frontend/js/results.js
// v20260104-results-fallback-safe

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const requestId = params.get("requestId") || "";

  // ⚠️ city telt NIET mee als zoektrigger
  const hasSearchContext =
  (q && q.trim().length > 0) ||
  (requestId && requestId.trim().length > 0);


  let url;

  if (!hasSearchContext) {
    // fallback → alle publieke bedrijven
    url = `${API_BASE}/publicCompanies`;
    setHeader(
      "Populaire bedrijven",
      "Selecteer filters of kies een bedrijf om verder te gaan."
    );
  } else {
    const searchParams = new URLSearchParams();
    if (q) searchParams.set("q", q);
    if (category && category.trim().length > 0) {
  searchParams.set("category", category);
}

    if (requestId) searchParams.set("requestId", requestId);

    url = `${API_BASE}/companies/search?${searchParams.toString()}`;
    setHeader(
      "Bedrijven in jouw regio",
      "Vergelijk bedrijven, lees reviews en vraag in één keer een offerte aan."
    );
  }

  try {
    const data = await safeJsonFetch(url);
    const companies = Array.isArray(data?.companies)
      ? data.companies
      : Array.isArray(data)
      ? data
      : [];

    renderResults(companies);
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    renderEmpty();
  }
}

function setHeader(title, subtitle) {
  const t = document.getElementById("resultsTitle");
  const s = document.getElementById("resultsSubtitle");
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle;
}

function renderResults(companies) {
  const grid = document.getElementById("resultsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!companies.length) {
    renderEmpty();
    return;
  }

  companies.forEach((c) => {
    const el = document.createElement("div");
    el.className = "company-card";
    el.innerHTML = `
      <h3>${c.name}</h3>
      ${c.avgRating ? `<div>⭐ ${c.avgRating} (${c.reviewCount || 0})</div>` : ""}
      ${c.city ? `<div>${c.city}</div>` : ""}
      <a href="/company.html?company=${c._id}" class="btn">Bekijk bedrijf</a>
    `;
    grid.appendChild(el);
  });
}

function renderEmpty() {
  const grid = document.getElementById("resultsGrid");
  if (!grid) return;
  grid.innerHTML = "<p>Geen bedrijven gevonden.</p>";
}

async function safeJsonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
