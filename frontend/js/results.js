// frontend/js/results.js
// v20251225-RESULTS-CLEAN-SLUG-FIX
//
// - ÉÉN bestand
// - Geen dubbele declaraties
// - Slug-based navigatie
// - Bestaande filters & sortering
// - Hele kaart klikbaar
// - ⭐ Sterren altijd geel (Irisje-kleur)

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
  const fullMode = params.get("full") === "1";

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  if (container) container.innerHTML = "";
  if (skeleton) skeleton.style.display = "grid";

  if (titleEl) {
    if (category && city) {
      titleEl.textContent = `${capitalizeFirst(category)} in ${city}`;
    } else if (category) {
      titleEl.textContent = `${capitalizeFirst(category)} in jouw regio`;
    } else if (city) {
      titleEl.textContent = `Bedrijven in ${city}`;
    } else {
      titleEl.textContent = "Bedrijven in jouw regio";
    }
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

    renderResults(fullMode);
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
    tagline: item.tagline || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    city: item.city || "",
    isVerified: Boolean(item.isVerified),
    rating: Number(item.avgRating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
    isGoogleImported,
  };
}

/* =========================
   RENDER
========================= */
function renderResults(forceFullMode) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const fullMode = forceFullMode === true || params.get("full") === "1";
  const LIMIT = 12;

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

  const toShow = fullMode ? list : list.slice(0, LIMIT);
  toShow.forEach(c => container.appendChild(buildCompanyCard(c)));

  if (!fullMode && list.length > LIMIT) {
    const a = document.createElement("a");
    const qs = new URLSearchParams(window.location.search);
    qs.set("full", "1");
    a.href = `?${qs}`;
    a.className =
      "col-span-full mt-4 inline-flex justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700";
    a.textContent = `Toon alle resultaten (${list.length})`;
    container.appendChild(a);
  }
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
   CARD
========================= */
function buildCompanyCard(c) {
  const el = document.createElement("article");
  el.className =
    "surface-card result-card p-6 rounded-2xl shadow-soft flex flex-col gap-4 cursor-pointer";
  el.dataset.slug = c.slug;

  el.innerHTML = `
    <h2 class="text-lg font-semibold">${escapeHtml(c.name)}</h2>
    ${renderRating(c)}
    <div class="text-xs text-slate-500">
      ${escapeHtml(c.city)} · ${escapeHtml(c.categories[0] || "")}
    </div>
    <div class="text-sm text-slate-600">${escapeHtml(c.tagline)}</div>
  `;

  el.addEventListener("click", () => {
    window.location.href =
      \`/company.html?slug=\${encodeURIComponent(c.slug)}\`;
  });

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
