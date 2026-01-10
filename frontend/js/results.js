// frontend/js/results.js
// v2026-01-10 — NORMALISATIE: sector + beroep

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];
let currentFilters = {
  sector: "",     // ⬅️ was category
  beroep: "",     // ⬅️ was specialty (frontend-only filter/links)
  city: "",
  q: "",
  verified: "",
  minRating: "",
  sort: "relevance",
};

document.addEventListener("DOMContentLoaded", () => {
  initResults();
});

function initResults() {
  const params = new URLSearchParams(window.location.search);

  // ⬇️ NORMALISATIE: sector / beroep
  currentFilters.sector = (params.get("sector") || "").trim();
  currentFilters.beroep = (params.get("beroep") || "").trim();
  currentFilters.city = (params.get("city") || "").trim();
  currentFilters.q = (params.get("q") || "").trim();

  loadResults();
}

async function loadResults() {
  const qs = new URLSearchParams();

  // Backend verwacht nog category/specialties → NIET wijzigen (randvoorwaarde)
  if (currentFilters.sector) qs.set("category", currentFilters.sector);
  if (currentFilters.city) qs.set("city", currentFilters.city);
  if (currentFilters.q) qs.set("q", currentFilters.q);
  if (currentFilters.verified) qs.set("verified", currentFilters.verified);
  if (currentFilters.minRating) qs.set("minRating", currentFilters.minRating);
  if (currentFilters.sort) qs.set("sort", currentFilters.sort);

  const url = `${API_BASE}/companies/search?${qs.toString()}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) return renderEmpty("Zoekresultaten laden mislukt.");

    allResults = Array.isArray(data.results) ? data.results : [];
    renderResults(allResults);
  } catch (err) {
    console.error("❌ Results load error:", err);
    renderEmpty("Zoekresultaten laden mislukt.");
  }
}

function renderResults(items) {
  const grid = document.getElementById("resultsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!items.length) return renderEmpty("Geen bedrijven gevonden.");

  items.forEach(c => {
    const card = document.createElement("a");
    card.href = `company.html?slug=${encodeURIComponent(c.slug || c._id)}`;
    card.className = "company-card";

    // ⬇️ Tags blijven inhoudelijk hetzelfde; linkjes worden beroep=...
    const tags = (c.specialties || []).slice(0, 3).map(t =>
      `<a class="tag" href="results.html?sector=${encodeURIComponent(currentFilters.sector)}&beroep=${encodeURIComponent(t)}">${escapeHtml(t)}</a>`
    ).join("");

    card.innerHTML = `
      <div class="company-card__head">
        <strong>${escapeHtml(c.name || "")}</strong>
        ${c.isVerified ? `<span class="badge-verified">Geverifieerd</span>` : ``}
      </div>
      <div class="company-card__meta">
        <span>${escapeHtml(c.city || "")}</span>
        <span>${renderStars(c.avgRating || 0)} (${c.reviewCount || 0})</span>
      </div>
      <div class="company-card__tags">${tags}</div>
    `;
    grid.appendChild(card);
  });
}

function renderEmpty(message) {
  const grid = document.getElementById("resultsGrid");
  if (grid) grid.innerHTML = `<p class="empty">${message}</p>`;
}

// helpers
function renderStars(avg) {
  const full = Math.round(avg);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
}
function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
