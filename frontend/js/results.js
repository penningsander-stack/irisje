// frontend/js/results.js
// v20251219-RESULTS-REVIEWS-PREMIUM-YELLOW-FULL
//
// Herstelactie (op verzoek):
// - Reviews + rating zichtbaar
// - Sterren GEEL + premium uitstraling (Tailwind amber)
// - Geen andere functionaliteit aangepast

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
  if (!item || typeof item !== "object") return null;
  return {
    id: item._id || "",
    name: item.name || "Onbekend",
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
  el.className = "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-2";

  el.innerHTML = `
    <h2 class="text-base font-semibold">${escapeHtml(c.name)}</h2>
    <div class="text-sm text-slate-600">${escapeHtml(c.city)}</div>
    ${renderStars(c.rating, c.reviewCount)}
    ${c.tagline ? `<div class="text-sm text-slate-600">${escapeHtml(c.tagline)}</div>` : ""}
  `;
  return el;
}

function renderStars(rating, count) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const empty = 5 - full;
  const stars =
    `<span class="text-amber-500">` + "★".repeat(full) + `</span>` +
    `<span class="text-amber-300">` + "☆".repeat(empty) + `</span>`;
  return `
    <div class="flex items-center gap-2 text-sm">
      <div class="tracking-tight">${stars}</div>
      <span class="text-slate-600 font-medium">${formatRating(r)}</span>
      <span class="text-slate-500">(${count} review${count === 1 ? "" : "s"})</span>
    </div>
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
