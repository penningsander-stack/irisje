// frontend/js/results.js
// v2026-01-10 — FIX: category-filter uit URL altijd toepassen

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];
let currentFilters = {
  category: "",
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

  // 🔴 FIX: category ALTIJD uit URL lezen
  currentFilters.category = (params.get("category") || "").trim();
  currentFilters.city = (params.get("city") || "").trim();
  currentFilters.q = (params.get("q") || "").trim();

  loadResults();
}

async function loadResults() {
  const qs = new URLSearchParams();

  // 🔴 FIX: category altijd meesturen indien aanwezig
  if (currentFilters.category) qs.set("category", currentFilters.category);
  if (currentFilters.city) qs.set("city", currentFilters.city);
  if (currentFilters.q) qs.set("q", currentFilters.q);
  if (currentFilters.verified) qs.set("verified", currentFilters.verified);
  if (currentFilters.minRating) qs.set("minRating", currentFilters.minRating);
  if (currentFilters.sort) qs.set("sort", currentFilters.sort);

  const url = `${API_BASE}/companies/search?${qs.toString()}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok) {
      renderEmpty("Zoekresultaten laden mislukt.");
      return;
    }

    allResults = Array.isArray(data.results) ? data.results : [];
    renderResults(allResults);
  } catch (err) {
    console.error("❌ Results load error:", err);
    renderEmpty("Zoekresultaten laden mislukt.");
  }
}

function renderResults(items) {
  const grid = document.getElementById("resultsGrid");
  const title = document.getElementById("resultsTitle");

  if (!grid) return;

  grid.innerHTML = "";

  // Titel aanpassen
  if (title) {
    if (currentFilters.category) {
      title.textContent = `Bedrijven binnen ${capitalize(currentFilters.category)}`;
    } else {
      title.textContent = "Alle bedrijven";
    }
  }

  if (!items.length) {
    renderEmpty("Geen bedrijven gevonden.");
    return;
  }

  items.forEach(c => {
    const card = document.createElement("a");
    card.href = `company.html?id=${c._id}`;
    card.className = "company-card";

    card.innerHTML = `
      <div class="company-card__head">
        <strong>${escapeHtml(c.name || "")}</strong>
        ${c.isVerified ? `<span class="badge-verified">Geverifieerd</span>` : ``}
      </div>
      <div class="company-card__meta">
        <span>${escapeHtml(c.city || "")}</span>
        <span>${renderStars(c.avgRating || 0)} (${c.reviewCount || 0})</span>
      </div>
      <div class="company-card__tags">
        ${(c.specialties || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
    `;

    grid.appendChild(card);
  });
}

function renderEmpty(message) {
  const grid = document.getElementById("resultsGrid");
  const title = document.getElementById("resultsTitle");
  if (grid) grid.innerHTML = `<p class="empty">${message}</p>`;
  if (title && currentFilters.category) {
    title.textContent = `Bedrijven binnen ${capitalize(currentFilters.category)}`;
  }
}

// Helpers
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
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
