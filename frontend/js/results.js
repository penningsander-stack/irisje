// frontend/js/results.js
// v20251225-RESULTS-CLEAN-SLUG-FINAL
//
// FIX:
// - Cards weer <a> (NIET article)
// - Tegels niet meer leeg
// - Sterren altijd geel
// - Geen regressies

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
  bindControls();
});

/* =========================
   INIT
========================= */
async function initSearchResults() {
  const params = new URLSearchParams(window.location.search);

  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const city = params.get("city") || "";

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  if (container) container.innerHTML = "";
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
    const res = await fetch(`${API_BASE}/companies/search?${searchParams}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data.results) ? data.results : [];

    allResults = items.map(normalizeCompany).filter(Boolean);

    if (skeleton) skeleton.style.display = "none";

    if (!allResults.length) {
      container.innerHTML =
        `<div class="text-sm text-slate-500">Geen bedrijven gevonden.</div>`;
      return;
    }

    renderResults();
  } catch (err) {
    console.error(err);
    if (skeleton) skeleton.style.display = "none";
    container.innerHTML =
      `<div class="text-sm text-red-500">Fout bij laden resultaten.</div>`;
  }
}

/* =========================
   FILTERS
========================= */
function bindControls() {
  bind("filterMinRating", "minRating");
  bind("filterVerified", "verified");
  bind("filterSource", "source");
  bind("sortResults", "sort");
}

function bind(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("change", () => {
    currentFilters[key] = el.value || "";
    renderResults();
  });
}

/* =========================
   NORMALIZE
========================= */
function normalizeCompany(item) {
  if (!item || typeof item !== "object") return null;

  const email = item.email || "";
  const isGoogleImported =
    email.startsWith("noemail_") && email.endsWith("@irisje.nl");

  return {
    slug: item.slug || "",
    name: item.name || "Onbekend bedrijf",
    city: item.city || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    rating: Number(item.avgRating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
    isVerified: Boolean(item.isVerified),
    isGoogleImported,
  };
}

/* =========================
   RENDER
========================= */
function renderResults() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  let list = [...allResults];

  if (currentFilters.minRating) {
    list = list.filter(c => c.rating >= Number(currentFilters.minRating));
  }
  if (currentFilters.verified === "yes") {
    list = list.filter(c => c.isVerified);
  }
  if (currentFilters.source === "google") {
    list = list.filter(c => c.isGoogleImported);
  }
  if (currentFilters.source === "irisje") {
    list = list.filter(c => !c.isGoogleImported);
  }

  list = sortResults(list, currentFilters.sort);
  container.innerHTML = "";

  list.forEach(c => container.appendChild(buildCompanyCard(c)));
}

/* =========================
   SORT
========================= */
function sortResults(arr, mode) {
  const a = [...arr];
  if (mode === "rating") a.sort((x, y) => y.rating - x.rating);
  if (mode === "reviews") a.sort((x, y) => y.reviewCount - x.reviewCount);
  if (mode === "az") a.sort((x, y) => x.name.localeCompare(y.name, "nl"));
  if (mode === "verified") {
    a.sort((x, y) => (y.isVerified ? 1 : 0) - (x.isVerified ? 1 : 0));
  }
  return a;
}

/* =========================
   CARD  ✅ TERUG NAAR <a>
========================= */
function buildCompanyCard(c) {
  const el = document.createElement("a");
  el.href = `/company.html?slug=${encodeURIComponent(c.slug)}`;
  el.className =
    "surface-card result-card p-6 rounded-2xl shadow-soft flex flex-col gap-3 hover:shadow-md transition";

  el.innerHTML = `
    <h3 class="text-base font-semibold text-slate-900">${escapeHtml(c.name)}</h3>
    ${renderRating(c)}
    <div class="text-xs text-slate-500">
      ${escapeHtml(c.city)} · ${escapeHtml(c.categories[0] || "")}
    </div>
  `;

  return el;
}

/* =========================
   HELPERS
========================= */
function renderRating(c) {
  if (!c.reviewCount || c.reviewCount < 1) {
    return `<div class="text-xs text-slate-500">Nog geen reviews</div>`;
  }

  const stars = "★".repeat(Math.round(c.rating));

  return `
    <div class="flex items-center gap-2 text-sm">
      <span style="color:#f59e0b">${stars}</span>
      <span class="font-medium">${formatRating(c.rating)}</span>
      <span class="text-xs text-slate-500">(${c.reviewCount})</span>
      ${c.isVerified ? `<span class="ml-2 text-emerald-600 text-xs">✔ Geverifieerd</span>` : ""}
    </div>
  `;
}

function formatRating(n) {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}
