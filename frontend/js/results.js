// frontend/js/results.js
// v2026-01-16 — FRONTEND SECTOR-ALIAS NORMALISATIE (definitief)

const API_BASE = "https://irisje-backend.onrender.com/api";

/**
 * Frontend-only sector normalisatie
 * URL-sector -> toegestane waarden in backenddata
 */
const SECTOR_ALIASES = {
  advocaat: ["advocaat", "juridisch"],
  juridisch: ["juridisch", "advocaat"],

  elektricien: ["elektricien", "elektriciens", "elektro", "installatie", "installatietechniek"],
  loodgieter: ["loodgieter", "loodgieters", "installatie"],
  schilder: ["schilder", "schilders"],
  dakdekker: ["dakdekker", "dakdekkers"],
  aannemer: ["aannemer", "bouw", "bouwbedrijf"],
  klusbedrijf: ["klusbedrijf", "klusbedrijven"],
  hovenier: ["hovenier", "tuin", "tuinonderhoud"],
  stukadoor: ["stukadoor", "stuc", "stucwerk"],
};

let currentFilters = {
  sector: "",
  beroep: "",
  city: "",
  q: "",
};

document.addEventListener("DOMContentLoaded", initResults);

function initResults() {
  const params = new URLSearchParams(window.location.search);

  currentFilters.sector = (params.get("sector") || "").toLowerCase().trim();
  currentFilters.beroep = (params.get("beroep") || "").trim();
  currentFilters.city = (params.get("city") || "").trim();
  currentFilters.q = (params.get("q") || "").trim();

  loadResults();
}

async function loadResults() {
  const qs = new URLSearchParams();

  // backend blijft category gebruiken
  if (currentFilters.sector) qs.set("category", currentFilters.sector);
  if (currentFilters.city) qs.set("city", currentFilters.city);
  if (currentFilters.q) qs.set("q", currentFilters.q);

  try {
    const res = await fetch(`${API_BASE}/companies/search?${qs.toString()}`);
    const json = await res.json();

    if (!json.ok || !Array.isArray(json.results)) {
      renderEmpty();
      return;
    }

    let results = json.results;

    // ✅ ROBUUSTE SECTOR FILTER
    if (currentFilters.sector) {
      const allowed = SECTOR_ALIASES[currentFilters.sector] || [currentFilters.sector];

      results = results.filter(c => {
        const raw =
          c.category ||
          c.categorySlug ||
          c.sector ||
          "";

        return allowed.includes(String(raw).toLowerCase());
      });
    }

    // ✅ BEROEP FILTER
    if (currentFilters.beroep) {
      results = results.filter(c =>
        Array.isArray(c.specialties) &&
        c.specialties.includes(currentFilters.beroep)
      );
    }

    renderResults(results);
  } catch (e) {
    console.error("❌ results load error", e);
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
    const el = document.createElement("a");
    el.className = "company-card";
    el.href = `company.html?slug=${encodeURIComponent(c.slug)}`;

    const tags = (c.specialties || []).slice(0, 3).map(s =>
      `<a class="tag" href="results.html?sector=${encodeURIComponent(currentFilters.sector)}&beroep=${encodeURIComponent(s)}">${escapeHtml(s)}</a>`
    ).join("");

    el.innerHTML = `
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

    grid.appendChild(el);
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
