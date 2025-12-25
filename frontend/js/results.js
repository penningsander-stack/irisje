// frontend/js/results.js
// v20251225-RESULTS-FIX-SLUG-COMPATIBLE
//
// FIXES:
// - Klikbare kaarten via slug (NIET id)
// - Compatibel met company.js
// - Verder exact jouw bestaande functionaliteit

const API_BASE = "https://irisje-backend.onrender.com/api";

let allResults = [];
let currentFilters = {
  minRating: "",// frontend/js/results.js
// v20251225-RESULTS-STEP-A
//
// Stap A (veilig, frontend-only):
// - Cards gelijke hoogte (h-full + flex)
// - Hele card klikbaar (a-tag over hele kaart)
// - Fallbacks (logo/stad/reviews)
// - Premium overlay consistent (classes toevoegen, geen backendregels aanpassen)
// - Bestaande filters + sortering ondersteunen
//
// Verwachtte DOM-IDs (bestaan in results.html):
// resultsTitle, resultsSkeleton, resultsControls,
// filterMinRating, filterVerified, filterSource, sortResults,
// resultsContainer

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

function bindControls() {
  const minRating = document.getElementById("filterMinRating");
  const verified = document.getElementById("filterVerified");
  const source = document.getElementById("filterSource");
  const sort = document.getElementById("sortResults");

  if (minRating) {
    minRating.addEventListener("change", () => {
      currentFilters.minRating = minRating.value;
      renderFiltered();
    });
  }
  if (verified) {
    verified.addEventListener("change", () => {
      currentFilters.verified = verified.value;
      renderFiltered();
    });
  }
  if (source) {
    source.addEventListener("change", () => {
      currentFilters.source = source.value;
      renderFiltered();
    });
  }
  if (sort) {
    sort.addEventListener("change", () => {
      currentFilters.sort = sort.value;
      renderFiltered();
    });
  }
}

async function initSearchResults() {
  const params = new URLSearchParams(window.location.search);

  const category = (params.get("category") || "").trim();
  const q = (params.get("q") || "").trim();
  const city = (params.get("city") || "").trim();
  const fullMode = params.get("full") === "1";

  setTitle({ category, q, city });

  showSkeleton(true);

  try {
    const url = new URL(API_BASE + "/companies/search");
    if (category) url.searchParams.set("category", category);
    if (q) url.searchParams.set("q", q);
    if (city) url.searchParams.set("city", city);
    if (fullMode) url.searchParams.set("full", "1");

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Backward compatible: items of companies, or data.companies
    const items = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.companies)
        ? data.companies
        : [];

    allResults = items.map(normalizeCompany);

    // Filters init (keep current selections)
    renderFiltered();

  } catch (err) {
    console.error("❌ results load error:", err);
    allResults = [];
    renderFiltered(true);
  } finally {
    showSkeleton(false);
  }
}

function setTitle({ category, q, city }) {
  const titleEl = document.getElementById("resultsTitle");
  if (!titleEl) return;

  // Zelfde titel-idee als je al had, maar simpel en veilig:
  // (geen aannames over categorie-mappings)
  const parts = [];
  if (category) parts.push(category);
  if (q) parts.push(`"${q}"`);
  if (city) parts.push(city);

  titleEl.textContent = parts.length
    ? `Resultaten voor ${parts.join(" • ")}`
    : "Bedrijven in jouw regio";
}

function showSkeleton(show) {
  const sk = document.getElementById("resultsSkeleton");
  const controls = document.getElementById("resultsControls");
  if (sk) sk.style.display = show ? "" : "none";
  if (controls) controls.style.display = show ? "none" : "";
}

function renderFiltered(isError = false) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (isError) {
    container.innerHTML = renderEmptyCard("Resultaten konden niet worden geladen. Probeer opnieuw.");
    return;
  }

  let list = [...allResults];

  // Filter: min rating
  if (currentFilters.minRating) {
    const min = Number(currentFilters.minRating);
    list = list.filter((c) => (c.rating || 0) >= min);
  }

  // Filter: verified
  if (currentFilters.verified === "yes") {
    list = list.filter((c) => Boolean(c.verified));
  }

  // Filter: source (google/irisje)
  if (currentFilters.source === "google") {
    list = list.filter((c) => (c.reviewSource || "").toLowerCase() === "google");
  } else if (currentFilters.source === "irisje") {
    list = list.filter((c) => (c.reviewSource || "").toLowerCase() === "irisje");
  }

  // Sort
  list = sortCompanies(list, currentFilters.sort);

  if (list.length === 0) {
    container.innerHTML = renderEmptyCard("Geen bedrijven gevonden met deze filters.");
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach((company) => frag.appendChild(buildCompanyCard(company)));
  container.appendChild(frag);
}

function sortCompanies(list, mode) {
  const arr = [...list];

  switch (mode) {
    case "rating":
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "reviews":
      return arr.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    case "verified":
      return arr.sort((a, b) => Number(Boolean(b.verified)) - Number(Boolean(a.verified)));
    case "az":
      return arr.sort((a, b) => (a.name || "").localeCompare(b.name || "", "nl"));
    case "relevance":
    default:
      // Als backend al op relevantie sorteert: niets forceren.
      return arr;
  }
}

function normalizeCompany(raw) {
  const c = raw || {};
  return {
    _id: c._id || c.id || "",
    name: safeText(c.name) || "Onbekend bedrijf",
    city: safeText(c.city),
    logo: safeText(c.logo),
    rating: toNumber(c.rating),
    reviewCount: toNumber(c.reviewCount ?? c.reviewsCount ?? c.totalReviews),
    verified: Boolean(c.verified ?? c.isVerified),
    // bron kan bij jou anders heten; houden we flexibel
    reviewSource: safeText(c.source ?? c.reviewSource),
    isPremium: Boolean(c.isPremium ?? c.premium),
    category: safeText(c.category),
    tagline: safeText(c.tagline ?? c.descriptionShort),
  };
}

function buildCompanyCard(company) {
  // ✅ Hele card klikbaar:
  const a = document.createElement("a");
  a.href = `company.html?id=${encodeURIComponent(company._id)}`;
  a.className = [
    "surface-card",
    "p-5",
    "rounded-2xl",
    "shadow-soft",
    "hover:shadow-lg",
    "transition",
    "flex",
    "flex-col",
    "gap-3",
    "h-full", // ✅ gelijke hoogte in grid
    "relative",
  ].join(" ");

  // ✅ Premium overlay consistent:
  // We voegen classes toe die je premium css kan gebruiken.
  // (Geen aanname over exacte classnamen: we zetten er meerdere neer)
  if (company.isPremium) {
    a.classList.add("premium-card", "is-premium");
  }

  const logoUrl = company.logo || "/img/logo-placeholder.png";
  const city = company.city || "Plaats onbekend";
  const rating = company.rating ? company.rating.toFixed(1) : "";
  const reviewCount = Number.isFinite(company.reviewCount) && company.reviewCount > 0
    ? company.reviewCount
    : 0;

  // Header row: logo + naam
  const top = document.createElement("div");
  top.className = "flex items-start gap-3";

  const logoWrap = document.createElement("div");
  logoWrap.className = "w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0";

  const img = document.createElement("img");
  img.src = logoUrl;
  img.alt = company.name;
  img.className = "w-full h-full object-contain p-1";
  img.loading = "lazy";
  img.onerror = () => {
    img.onerror = null;
    img.src = "/img/logo-placeholder.png";
  };

  logoWrap.appendChild(img);

  const titleWrap = document.createElement("div");
  titleWrap.className = "min-w-0";

  const h3 = document.createElement("h3");
  h3.className = "text-base font-semibold text-slate-900 leading-snug truncate";
  h3.textContent = company.name;

  const meta = document.createElement("div");
  meta.className = "text-xs text-slate-500 mt-0.5";
  meta.textContent = city;

  titleWrap.appendChild(h3);
  titleWrap.appendChild(meta);

  top.appendChild(logoWrap);
  top.appendChild(titleWrap);

  // Rating row
  const ratingRow = document.createElement("div");
  ratingRow.className = "flex items-center justify-between";

  const left = document.createElement("div");
  left.className = "text-sm text-slate-700";

  if (rating && reviewCount > 0) {
    left.innerHTML = `<span class="font-semibold">${escapeHtml(rating)}</span> <span class="text-slate-400">(${escapeHtml(String(reviewCount))} reviews)</span>`;
  } else if (reviewCount > 0) {
    left.innerHTML = `<span class="text-slate-500">${escapeHtml(String(reviewCount))} reviews</span>`;
  } else {
    left.innerHTML = `<span class="text-slate-400">Nog geen reviews</span>`;
  }

  const right = document.createElement("div");
  right.className = "flex items-center gap-2";

  if (company.verified) {
    const v = document.createElement("span");
    v.className = "text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100";
    v.textContent = "Geverifieerd";
    right.appendChild(v);
  }

  ratingRow.appendChild(left);
  ratingRow.appendChild(right);

  // Tagline/omschrijving (fallback)
  const desc = document.createElement("p");
  desc.className = "text-sm text-slate-500 leading-relaxed line-clamp-3";
  desc.textContent = company.tagline || "Klik voor meer informatie, reviews en contactgegevens.";

  // CTA row (blijft onderaan door mt-auto)
  const cta = document.createElement("div");
  cta.className = "mt-auto pt-2 flex items-center justify-between";

  const ctaText = document.createElement("span");
  ctaText.className = "text-sm font-medium text-indigo-700";
  ctaText.textContent = "Bekijk profiel";

  const arrow = document.createElement("span");
  arrow.className = "text-indigo-500";
  arrow.textContent = "→";

  cta.appendChild(ctaText);
  cta.appendChild(arrow);

  // Premium badge overlay element (optioneel; CSS mag dit stylen)
  if (company.isPremium) {
    const badge = document.createElement("div");
    badge.className = "premium-badge absolute top-3 right-3 text-[11px] px-2 py-1 rounded-full";
    badge.textContent = "Premium";
    a.appendChild(badge);
  }

  a.appendChild(top);
  a.appendChild(ratingRow);
  a.appendChild(desc);
  a.appendChild(cta);

  return a;
}

function renderEmptyCard(text) {
  return `
    <div class="surface-card p-6 rounded-2xl shadow-soft text-slate-600">
      ${escapeHtml(text)}
    </div>
  `;
}

function safeText(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

  verified: "",
  source: "",
  sort: "relevance",
};

document.addEventListener("DOMContentLoaded", () => {
  initSearchResults();
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
    const res = await fetch(`${API_BASE}/companies/search?${searchParams.toString()}`);
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

    initFilterControls();
    renderResults(fullMode);
  } catch (err) {
    console.error(err);
    if (skeleton) skeleton.style.display = "none";
    container.innerHTML =
      `<div class="text-sm text-red-500">Fout bij laden resultaten.</div>`;
  }
}

/* =========================
   NORMALIZE  ✅ SLUG TOEGEVOEGD
========================= */
function normalizeCompany(item) {
  if (!item || typeof item !== "object") return null;

  const email = item.email || "";
  const isGoogleImported =
    typeof email === "string" &&
    email.startsWith("noemail_") &&
    email.endsWith("@irisje.nl");

  return {
    id: item._id || "",
    slug: item.slug || "",              // ✅ BELANGRIJK
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
   FILTERS
========================= */
function initFilterControls() {
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
    list = list.filter((c) => c.rating >= Number(currentFilters.minRating));
  }

  if (currentFilters.verified === "yes") {
    list = list.filter((c) => c.isVerified);
  }

  if (currentFilters.source === "google") {
    list = list.filter((c) => c.isGoogleImported);
  }
  if (currentFilters.source === "irisje") {
    list = list.filter((c) => !c.isGoogleImported);
  }

  list = sortResults(list, currentFilters.sort);
  container.innerHTML = "";

  const toShow = fullMode ? list : list.slice(0, LIMIT);
  toShow.forEach((c) => container.appendChild(buildCompanyCard(c)));

  if (!fullMode && list.length > LIMIT) {
    const a = document.createElement("a");
    const qs = new URLSearchParams(window.location.search);
    qs.set("full", "1");
    a.href = `?${qs.toString()}`;
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
  if (mode === "verified") a.sort((x, y) =>
    (y.isVerified ? 1 : 0) - (x.isVerified ? 1 : 0)
  );
  return a;
}

/* =========================
   CARD
========================= */
function buildCompanyCard(c) {
  const el = document.createElement("article");
  el.className =
    "surface-card result-card p-6 rounded-2xl shadow-soft flex flex-col gap-4";
  el.dataset.slug = c.slug;              // ✅ SLUG
  el.style.cursor = "pointer";

  el.innerHTML = `
    <h2 class="text-lg font-semibold">${escapeHtml(c.name)}</h2>
    ${renderRating(c)}
    <div class="text-xs text-slate-500">
      ${escapeHtml(c.city)} · ${escapeHtml(c.categories[0] || "")}
    </div>
    <div class="text-sm text-slate-600">${escapeHtml(c.tagline)}</div>
  `;

  return el;
}

/* =========================
   CLICK HANDLER  ✅ FIX
========================= */
document.addEventListener("click", (e) => {
  const card = e.target.closest(".result-card");
  if (!card || !card.dataset.slug) return;
  window.location.href =
    `/company.html?slug=${encodeURIComponent(card.dataset.slug)}`;
});

/* =========================
   HELPERS
========================= */
function renderRating(c) {
  if (!c.reviewCount) {
    return `<div class="text-xs text-slate-500">Nog geen reviews</div>`;
  }
  return `
    <div class="flex items-center gap-2 text-sm">
      <span style="color:#f59e0b">${"★".repeat(Math.round(c.rating))}</span>
      <span>${formatRating(c.rating)}</span>
      <span class="text-xs text-slate-500">(${c.reviewCount})</span>
      ${c.isVerified
        ? `<span class="ml-2 text-emerald-600 text-xs">✔ Geverifieerd</span>`
        : ""}
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
