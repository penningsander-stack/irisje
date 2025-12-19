// frontend/js/results.js
// v20251219-RESULTS-REVIEWS-RESTORE
//
// Zoekresultatenpagina: laadt bedrijven vanuit /api/companies/search,
// toont ze in een grid en ondersteunt filters + sorteren.
// Inclusief fallback-melding indien backend fallbackUsed=true retourneert.
//
// FIX: reviewCount + rating (sterren) weer zichtbaar op de bedrijfscards (regressie-herstel).

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
    const res = await fetch(
      `${API_BASE}/companies/search?${searchParams.toString()}`
    );
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

    // 🔔 Fallback-melding
    if (data.fallbackUsed === true && data.message && container.parentNode) {
      const notice = document.createElement("div");
      notice.id = "fallbackNotice";
      notice.className =
        "mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800";
      notice.textContent = data.message;
      container.parentNode.insertBefore(notice, container);
    }

    if (!allResults.length) {
      container.innerHTML = `
        <div class="text-sm text-slate-500">
          Geen bedrijven gevonden. Probeer een andere zoekterm of plaats.
        </div>
      `;
      return;
    }

    initFilterControls();
    renderResults(fullMode);
  } catch (err) {
    console.error("❌ Fout bij laden resultaten:", err);
    if (skeleton) skeleton.style.display = "none";
    if (container) {
      container.innerHTML = `
        <div class="text-sm text-red-500">
          Er ging iets mis bij het laden van de resultaten.
        </div>
      `;
    }
  }
}

function normalizeCompany(item) {
  if (!item || typeof item !== "object") return null;

  const rating = Number(item.avgRating) || 0;
  const reviewCount = Number(item.reviewCount) || 0;

  const email = item.email || "";
  const isGoogleImported =
    email.startsWith("noemail_") && email.endsWith("@irisje.nl");

  return {
    id: item._id || "",
    name: item.name || "Onbekend bedrijf",
    slug: item.slug || "",
    tagline: item.tagline || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    city: item.city || "",
    isVerified: Boolean(item.isVerified),
    rating,
    reviewCount,
    isGoogleImported,
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

  if (currentFilters.minRating) {
    const min = Number(currentFilters.minRating);
    filtered = filtered.filter((c) => c.rating >= min);
  }

  if (currentFilters.verified === "yes") {
    filtered = filtered.filter((c) => c.isVerified);
  }

  if (currentFilters.source === "google") {
    filtered = filtered.filter((c) => c.isGoogleImported);
  } else if (currentFilters.source === "irisje") {
    filtered = filtered.filter((c) => !c.isGoogleImported);
  }

  filtered = sortResults(filtered, currentFilters.sort);
  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = `
      <div class="text-sm text-slate-500">
        Geen bedrijven gevonden met deze filters.
      </div>
    `;
    return;
  }

  const toShow = fullMode ? filtered : filtered.slice(0, LIMIT);
  toShow.forEach((c) => container.appendChild(buildCompanyCard(c)));

  if (!fullMode && filtered.length > LIMIT) {
    const btn = document.createElement("a");
    const base = new URLSearchParams(window.location.search);
    base.set("full", "1");
    btn.href = `?${base.toString()}`;
    btn.className =
      "col-span-full mt-4 inline-flex justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700";
    btn.textContent = `Toon alle resultaten (${filtered.length})`;
    container.appendChild(btn);
  }
}

function sortResults(list, mode) {
  const arr = [...list];
  if (mode === "rating") arr.sort((a, b) => b.rating - a.rating);
  if (mode === "reviews") arr.sort((a, b) => b.reviewCount - a.reviewCount);
  if (mode === "az") arr.sort((a, b) => a.name.localeCompare(b.name, "nl"));
  if (mode === "verified")
    arr.sort((a, b) =>
      a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1
    );
  return arr;
}

function buildCompanyCard(c) {
  const el = document.createElement("article");
  el.className = "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-3";

  const stars = renderStars(c.rating);
  const ratingLine =
    c.reviewCount > 0
      ? `${stars}<span class="ml-2 text-slate-600">${formatRating(
          c.rating
        )}</span><span class="ml-2 text-slate-500">(${c.reviewCount} review${
          c.reviewCount === 1 ? "" : "s"
        })</span>`
      : `<span class="text-slate-500">Nog geen reviews</span>`;

  el.innerHTML = `
    <h2 class="text-base font-semibold">${escapeHtml(c.name)}</h2>

    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <div class="text-slate-600">${escapeHtml(c.city)}</div>
      ${
        c.isVerified
          ? `<span class="text-xs text-emerald-700">✔ Geverifieerd</span>`
          : ""
      }
      <div class="ml-auto text-sm whitespace-nowrap">${ratingLine}</div>
    </div>

    ${c.tagline ? `<div class="text-sm text-slate-600">${escapeHtml(c.tagline)}</div>` : ""}
  `;

  return el;
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const fullStar = `<span aria-hidden="true">★</span>`;
  const halfStar = `<span aria-hidden="true">☆</span>`; // half-star fallback (simple)
  const emptyStar = `<span aria-hidden="true">☆</span>`;

  // Keep it simple and stable: full stars for integer part; if half => one empty star (visual hint), rest empty.
  const starsHtml =
    `<span class="text-amber-500">${fullStar.repeat(full)}</span>` +
    (half ? `<span class="text-amber-500">${halfStar}</span>` : "") +
    `<span class="text-slate-300">${emptyStar.repeat(empty)}</span>`;

  return `<span class="inline-flex items-center leading-none" aria-label="${formatRating(r)} van 5">${starsHtml}</span>`;
}

function formatRating(n) {
  const num = Number(n) || 0;
  // 1 decimaal, NL-notatie
  return (Math.round(num * 10) / 10).toString().replace(".", ",");
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
