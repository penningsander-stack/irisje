// frontend/js/results.js
// v20251213-RESULTS-ADVANCED-FILTERS-SORT
//
// Zoekresultatenpagina: laadt bedrijven vanuit /api/companies/search,
// toont ze in een grid en ondersteunt filters + sorteren.
//
// Functionaliteit:
// - Leest category, q, city, full uit de URL
// - Haalt bedrijven op via /api/companies/search
// - Slaat de originele lijst op in memory
// - Past filters + sortering client-side toe
// - Toont maximaal LIMIT resultaten, tenzij ?full=1
// - Toont rating + aantal reviews, met bronlabel (Google / Irisje)
//   op basis van het e-mailadrespatroon noemail_<placeId>@irisje.nl

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

  if (container) {
    container.innerHTML = "";
  }

  if (skeleton) {
    skeleton.style.display = "grid";
  }

  // Titel een beetje dynamischer maken
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

  // Querystring opbouwen voor backend
  const searchParams = new URLSearchParams();
  if (category) searchParams.set("category", category);
  if (q) searchParams.set("q", q);
  if (city) searchParams.set("city", city);

  const url = `${API_BASE}/companies/search?${searchParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (Array.isArray(data.items)) {
      items = data.items;
    } else if (Array.isArray(data.results)) {
      items = data.results;
    }

    allResults = (items || []).map(normalizeCompany).filter(Boolean);

    if (skeleton) {
      skeleton.style.display = "none";
    }

    if (!container) return;

    if (!allResults.length) {
      container.innerHTML = `
        <div class="text-sm text-slate-500">
          Geen bedrijven gevonden. Probeer een andere zoekterm of plaats.
        </div>
      `;
      return;
    }

    // Filters & sort controls koppelen
    initFilterControls();

    // Eerste render
    renderResults(fullMode);
  } catch (err) {
    console.error("❌ Fout bij laden resultaten:", err);
    if (skeleton) {
      skeleton.style.display = "none";
    }
    if (container) {
      container.innerHTML = `
        <div class="text-sm text-red-500">
          Er ging iets mis bij het laden van de resultaten. Probeer het later opnieuw.
        </div>
      `;
    }
  }
}

// Normaliseer de structuur van een company-result
function normalizeCompany(item) {
  if (!item || typeof item !== "object") return null;

  const ratingRaw = Number(item.avgRating);
  const reviewCountRaw = Number(item.reviewCount);

  const rating = isNaN(ratingRaw) ? 0 : ratingRaw;
  const reviewCount = isNaN(reviewCountRaw) ? 0 : reviewCountRaw;

  const email = item.email || "";
  const isGoogleImported =
    typeof email === "string" &&
    email.startsWith("noemail_") &&
    email.endsWith("@irisje.nl");

  return {
    id: item._id || "",
    name: item.name || "Onbekend bedrijf",
    slug: item.slug || "",
    tagline: item.tagline || "",
    description: item.description || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    city: item.city || "",
    phone: item.phone || "",
    website: item.website || "",
    isVerified: Boolean(item.isVerified),
    rating,
    reviewCount,
    email,
    isGoogleImported,
  };
}

// Filter- en sorteercontrols koppelen aan events
function initFilterControls() {
  const minRatingEl = document.getElementById("filterMinRating");
  const verifiedEl = document.getElementById("filterVerified");
  const sourceEl = document.getElementById("filterSource");
  const sortEl = document.getElementById("sortResults");

  if (minRatingEl) {
    minRatingEl.addEventListener("change", () => {
      currentFilters.minRating = minRatingEl.value || "";
      renderResults();
    });
  }

  if (verifiedEl) {
    verifiedEl.addEventListener("change", () => {
      currentFilters.verified = verifiedEl.value || "";
      renderResults();
    });
  }

  if (sourceEl) {
    sourceEl.addEventListener("change", () => {
      currentFilters.source = sourceEl.value || "";
      renderResults();
    });
  }

  if (sortEl) {
    sortEl.addEventListener("change", () => {
      currentFilters.sort = sortEl.value || "relevance";
      renderResults();
    });
  }
}

// Toepassen van filters + sorteren en dan renderen
function renderResults(forceFullMode) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const fullModeParam = params.get("full") === "1";
  const fullMode = forceFullMode === true || fullModeParam;

  const LIMIT = 12;

  let filtered = [...allResults];

  // Minimaal rating-filter
  if (currentFilters.minRating) {
    const min = Number(currentFilters.minRating);
    if (!isNaN(min) && min > 0) {
      filtered = filtered.filter((c) => c.rating >= min);
    }
  }

  // Geverifieerde bedrijven
  if (currentFilters.verified === "yes") {
    filtered = filtered.filter((c) => c.isVerified);
  }

  // Bron-filter
  if (currentFilters.source === "google") {
    filtered = filtered.filter((c) => c.isGoogleImported);
  } else if (currentFilters.source === "irisje") {
    filtered = filtered.filter((c) => !c.isGoogleImported);
  }

  // Sorteren
  filtered = sortResults(filtered, currentFilters.sort);

  container.innerHTML = "";

  if (!filtered.length) {
    container.innerHTML = `
      <div class="text-sm text-slate-500">
        Geen bedrijven gevonden met deze filters. Pas de filters aan om meer resultaten te zien.
      </div>
    `;
    return;
  }

  const total = filtered.length;
  const toShow = fullMode ? filtered : filtered.slice(0, LIMIT);

  toShow.forEach((company) => {
    const card = buildCompanyCard(company);
    container.appendChild(card);
  });

  // Toon "Toon alle resultaten"-link als er meer zijn
  if (!fullMode && total > LIMIT) {
    const btnWrapper = document.createElement("div");
    btnWrapper.className = "col-span-full text-center mt-4";

    const baseParams = new URLSearchParams(window.location.search);
    baseParams.set("full", "1");

    const btn = document.createElement("a");
    btn.href = window.location.pathname + "?" + baseParams.toString();
    btn.className =
      "inline-flex items-center justify-center px-4 py-2 text-sm rounded-full border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100";
    btn.textContent = `Toon alle resultaten (${total})`;

    btnWrapper.appendChild(btn);
    container.appendChild(btnWrapper);
  }
}

// Sorteerfunctie
function sortResults(list, mode) {
  const arr = [...list];

  switch (mode) {
    case "rating":
      arr.sort((a, b) => b.rating - a.rating);
      break;
    case "reviews":
      arr.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case "verified":
      arr.sort((a, b) => {
        if (a.isVerified === b.isVerified) return 0;
        return a.isVerified ? -1 : 1;
      });
      break;
    case "az":
      arr.sort((a, b) => a.name.localeCompare(b.name, "nl", { sensitivity: "base" }));
      break;
    case "relevance":
    default:
      // Laat de originele volgorde zoals binnengekomen van de backend
      break;
  }

  return arr;
}

// Kaart opbouwen
function buildCompanyCard(company) {
  const card = document.createElement("article");
  card.className =
    "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-3";

  const name = company.name;
  const city = company.city;
  const cats = company.categories || [];
  const tagline = company.tagline || "";
  const isVerified = company.isVerified;
  const rating = company.rating;
  const reviewCount = company.reviewCount;
  const isGoogleImported = company.isGoogleImported;
  const slug = company.slug;

  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let stars = "★".repeat(fullStars);
  if (halfStar) stars += "☆";
  stars += "✩".repeat(emptyStars);

  let categoryDisplay = "";
  if (Array.isArray(cats) && cats.length > 0) {
    categoryDisplay = cats.slice(0, 2).join(", ");
    if (cats.length > 2) {
      categoryDisplay += ` (+${cats.length - 2})`;
    }
  }

  let ratingRow = "";
  if (reviewCount > 0 && rating > 0) {
    const sourceLabel = isGoogleImported ? "Google" : "Irisje";
    ratingRow = `
      <div class="flex items-center gap-1 text-xs">
        <span class="text-[16px]" style="color:#f59e0b;">${stars}</span>
        <span class="text-slate-700">${rating.toFixed(1)} • ${sourceLabel} • ${reviewCount} reviews</span>
      </div>
    `;
  }

  const verifiedBadge = isVerified
    ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] gap-1">
         ✔ Geverifieerd
       </span>`
    : "";

  const taglineRow = tagline
    ? `<p class="text-sm text-slate-700 mt-1 line-clamp-2">${escapeHtml(
        tagline
      )}</p>`
    : "";

  const metaRowParts = [];
  if (categoryDisplay) {
    metaRowParts.push(
      `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">${escapeHtml(
        categoryDisplay
      )}</span>`
    );
  }
  if (city) {
    metaRowParts.push(
      `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">${escapeHtml(
        city
      )}</span>`
    );
  }

  const metaRow =
    metaRowParts.length > 0
      ? `<div class="flex flex-wrap gap-2 mt-1">${metaRowParts.join("")}</div>`
      : "";

  const linkHref = slug ? `company.html?slug=${encodeURIComponent(slug)}` : "#";

  card.innerHTML = `
    <div class="flex flex-col gap-1">
      <h2 class="text-base font-semibold text-slate-900">
        <a href="${linkHref}" class="hover:underline">${escapeHtml(name)}</a>
      </h2>
      ${metaRow}
      ${ratingRow}
      ${verifiedBadge ? `<div class="mt-1">${verifiedBadge}</div>` : ""}
      ${taglineRow}
    </div>
    <div class="mt-3">
      <a href="${linkHref}" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
        Bekijk bedrijf
      </a>
    </div>
  `;

  return card;
}

function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simpele HTML-escape om XSS te voorkomen
function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
