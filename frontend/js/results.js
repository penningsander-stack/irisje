// frontend/js/results.js
// v2026-01-16 — FIX: sector-normalisatie + client-side fallback filtering

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];
let currentFilters = {
  sector: "",
  beroep: "",
  city: "",
  q: "",
  verified: "",
  minRating: "",
  sort: "relevance",
};

document.addEventListener("DOMContentLoaded", initResults);

function initResults() {
  const params = new URLSearchParams(window.location.search);

  currentFilters.sector = (params.get("sector") || "").trim();
  currentFilters.beroep = (params.get("beroep") || "").trim();
  currentFilters.city = (params.get("city") || "").trim();
  currentFilters.q = (params.get("q") || "").trim();

  loadResults();
}

async function loadResults() {
  const qs = new URLSearchParams();

  // Backend verwacht nog category
  if (currentFilters.sector) qs.set("category", currentFilters.sector);
  if (currentFilters.city) qs.set("city", currentFilters.city);
  if (currentFilters.q) qs.set("q", currentFilters.q);

  try {
    const res = await fetch(`${API_BASE}/companies/search?${qs.toString()}`);
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.results)) {
      renderEmpty();
      return;
    }

    allResults = data.results;

    // ✅ FRONTEND FALLBACK FILTER (ESSENTIEEL)
    let filtered = [...allResults];

    if (currentFilters.sector) {
      filtered = filtered.filter(c =>
        Array.isArray(c.categories) &&
        c.categories.includes(currentFilters.sector)
      );
    }

    if (currentFilters.beroep) {
      filtered = filtered.filter(c =>
        Array.isArray(c.specialties) &&
        c.specialties.includes(currentFilters.beroep)
      );
    }

    renderResults(filtered);
  } catch (err) {
    console.error("❌ Results load error:", err);
    renderEmpty();
  }
}

function renderResults(items) {
  const grid = document.getElementById("resultsGrid");
  const empty = document.getElementById("emptyState");

  grid.innerHTML = "";
  empty.classList.add("hidden");

  if (!items.length) {
    empty.classList.remove("hidden");
    return;
  }

  items.forEach(c => {
    const a = document.createElement("a");
    a.className = "company-card";
    a.href = `company.html?slug=${encodeURIComponent(c.slug)}`;

    const tags = (c.specialties || []).slice(0, 3).map(s =>
      `<a class="tag" href="results.html?sector=${encodeURIComponent(currentFilters.sector)}&beroep=${encodeURIComponent(s)}">${s}</a>`
    ).join("");

    a.innerHTML = `
      <div class="company-card__head">
        <strong>${escapeHtml(c.name)}</strong>
        ${c.isVerified ? `<span class="badge-verified">Geverifieerd</span>` : ""}
      </div>
      <div class="company-card__meta">
        <span>${escapeHtml(c.city || "")}</span>
        <span>${renderStars(c.avgRating || 0)} (${c.reviewCount || 0})</span>
      </div>
      <div class="company-card__tags">${tags}</div>
    `;

    grid.appendChild(a);
  });
}

function renderEmpty() {
  document.getElementById("resultsGrid").innerHTML = "";
  document.getElementById("emptyState").classList.remove("hidden");
}

function renderStars(avg) {
  const full = Math.round(avg);
  return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
