// frontend/js/results.js
// v20251219-RESULTS-REVIEWS-PREMIUM-YELLOW-FIX
//
// Fix:
// - Sterren altijd GEEL (inline style, CSS-proof)
// - Premium uitstraling
// - Reviews + ratings behouden
// - Verder niets gewijzigd

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];
let currentFilters = {
  minRating: "",
  verified: "",
  source: "",
  sort: "relevance",
};

document.addEventListener("DOMContentLoaded", () => {
  initSearchResults();
});

async function initSearchResults() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const city = params.get("city") || "";
  const fullMode = params.get("full") === "1";

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");
  const oldNotice = document.getElementById("fallbackNotice");

  if (container) container.innerHTML = "";
  if (oldNotice) oldNotice.remove();
  if (skeleton) skeleton.style.display = "grid";

  if (titleEl) {
    if (category && city) titleEl.textContent = `${capitalizeFirst(category)} in ${city}`;
    else if (category) titleEl.textContent = `${capitalizeFirst(category)} in jouw regio`;
    else if (city) titleEl.textContent = `Bedrijven in ${city}`;
    else titleEl.textContent = "Bedrijven in jouw regio";
  }

  const searchParams = new URLSearchParams();
  if (category) searchParams.set("category", category);
  if (q) searchParams.set("q", q);
  if (city) searchParams.set("city", city);

  try {
    const res = await fetch(`${API_BASE}/companies/search?${searchParams.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.items)
      ? data.items
      : [];

    allResults = items.map(normalizeCompany).filter(Boolean);

    if (skeleton) skeleton.style.display = "none";
    if (!container) return;

    if (!allResults.length) {
      container.innerHTML = `<div class="text-sm text-slate-500">Geen bedrijven gevonden.</div>`;
      return;
    }

    initFilterControls();
    renderResults(fullMode);
  } catch (err) {
    if (skeleton) skeleton.style.display = "none";
    if (container) container.innerHTML = `<div class="text-sm text-red-500">Fout bij laden.</div>`;
  }
}

function normalizeCompany(item) {
  return {
    id: item._id || "",
    name: item.name || "Onbekend bedrijf",
    city: item.city || "",
    tagline: item.tagline || "",
    rating: Number(item.avgRating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
    isVerified: Boolean(item.isVerified),
  };
}

function initFilterControls() {
  const bind = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
      currentFilters[key] = el.value || "";
      renderResults();
    });
  };
  bind("filterMinRating", "minRating");
  bind("filterVerified", "verified");
  bind("filterSource", "source");
  bind("sortResults", "sort");
}

function renderResults(forceFullMode) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const fullMode = forceFullMode === true || params.get("full") === "1";
  const LIMIT = 12;

  let filtered = [...allResults];
  filtered = sortResults(filtered, currentFilters.sort);

  container.innerHTML = "";
  const toShow = fullMode ? filtered : filtered.slice(0, LIMIT);
  toShow.forEach(c => container.appendChild(buildCompanyCard(c)));
}

function sortResults(list, mode) {
  const arr = [...list];
  if (mode === "rating") arr.sort((a, b) => b.rating - a.rating);
  if (mode === "reviews") arr.sort((a, b) => b.reviewCount - a.reviewCount);
  if (mode === "az") arr.sort((a, b) => a.name.localeCompare(b.name, "nl"));
  return arr;
}

function buildCompanyCard(c) {
  const el = document.createElement("article");
  el.className = "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-3";

  const ratingLine =
    c.reviewCount > 0
      ? `${renderStars(c.rating)}
         <span class="ml-2 text-slate-600 font-medium">${formatRating(c.rating)}</span>
         <span class="ml-2 text-slate-500">(${c.reviewCount} review${c.reviewCount === 1 ? "" : "s"})</span>`
      : `<span class="text-slate-500">Nog geen reviews</span>`;

  el.innerHTML = `
    <h2 class="text-base font-semibold">${escapeHtml(c.name)}</h2>
    <div class="flex items-center gap-3 text-sm">
      <span class="text-slate-600">${escapeHtml(c.city)}</span>
      ${c.isVerified ? `<span class="text-xs text-emerald-700">✔ Geverifieerd</span>` : ""}
      <span class="ml-auto whitespace-nowrap">${ratingLine}</span>
    </div>
    ${c.tagline ? `<div class="text-sm text-slate-600">${escapeHtml(c.tagline)}</div>` : ""}
  `;
  return el;
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const empty = 5 - full;

  const starStyle = 'style="color:#f59e0b;font-size:1rem;letter-spacing:1px"';

  return `
    <span aria-label="${formatRating(r)} van 5">
      <span ${starStyle}>${"★".repeat(full)}</span>
      <span style="color:#e5e7eb">${"★".repeat(empty)}</span>
    </span>
  `;
}

function formatRating(n) {
  return (Math.round((Number(n) || 0) * 10) / 10).toString().replace(".", ",");
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
