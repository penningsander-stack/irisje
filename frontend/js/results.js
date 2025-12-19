// frontend/js/results.js
// v20251219-RESULTS-HIGHEND-PREMIUM-YELLOW
//
// High-end premium UI + gele sterren (CSS-proof via inline styles).
// Behoudt bestaande functionaliteit: search, filters, sort, full-mode, skeleton, fallback notice.

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

    // 🔔 Fallback-melding
    if (data && data.fallbackUsed === true && data.message && container.parentNode) {
      const notice = document.createElement("div");
      notice.id = "fallbackNotice";
      notice.className =
        "mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800";
      notice.textContent = String(data.message);
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
    typeof email === "string" && email.startsWith("noemail_") && email.endsWith("@irisje.nl");

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
    website: item.website || "",
    phone: item.phone || "",
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
  if (!mode || mode === "relevance") return arr;

  if (mode === "rating") arr.sort((a, b) => b.rating - a.rating);
  if (mode === "reviews") arr.sort((a, b) => b.reviewCount - a.reviewCount);
  if (mode === "az") arr.sort((a, b) => a.name.localeCompare(b.name, "nl"));
  if (mode === "verified") {
    arr.sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1));
  }
  return arr;
}

function buildCompanyCard(c) {
  const el = document.createElement("article");
  el.className = "surface-card p-6 rounded-2xl shadow-soft flex flex-col gap-4";

  const hasReviews = c.reviewCount > 0;
  const ratingNum = clamp(c.rating, 0, 5);
  const isTop = hasReviews && ratingNum >= 4.5 && c.reviewCount >= 5;

  const verifiedPill = c.isVerified
    ? `<span class="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">✔ Geverifieerd</span>`
    : "";

  const ratingRow = hasReviews
    ? `
      <div class="flex items-center gap-3">
        ${renderStarsPremium(ratingNum)}
        <span class="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
          ${escapeHtml(formatRating(ratingNum))}
        </span>
        <span class="text-xs text-slate-500">${c.reviewCount} review${c.reviewCount === 1 ? "" : "s"}</span>
        ${isTop ? `<span class="ml-1 inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Top beoordeeld</span>` : ""}
      </div>
    `
    : `<div class="text-xs text-slate-500">Nog geen reviews</div>`;

  const metaRow = `
    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
      ${c.city ? `<span class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">${escapeHtml(c.city)}</span>` : ""}
      ${Array.isArray(c.categories) && c.categories.length ? `<span class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">${escapeHtml(c.categories[0])}</span>` : ""}
      ${c.isGoogleImported ? `<span class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">Bron: Google</span>` : `<span class="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1">Bron: Irisje</span>`}
    </div>
  `;

  const tagline = c.tagline
    ? `<div class="text-sm text-slate-600 leading-relaxed">${escapeHtml(c.tagline)}</div>`
    : "";

  el.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold leading-snug truncate">${escapeHtml(c.name)}</h2>
        <div class="mt-2">${ratingRow}</div>
      </div>
      <div class="shrink-0">${verifiedPill}</div>
    </div>

    ${metaRow}

    ${tagline}
  `;

  return el;
}

function renderStarsPremium(rating) {
  const r = clamp(Number(rating) || 0, 0, 5);
  const full = Math.floor(r);
  const empty = 5 - full;

  const fullStyle = 'style="color:#f59e0b;font-size:1.1rem;line-height:1;letter-spacing:1px"';
  const emptyStyle = 'style="color:#e5e7eb;font-size:1.1rem;line-height:1;letter-spacing:1px"';

  return `
    <span aria-label="${escapeHtml(formatRating(r))} van 5" class="inline-flex items-center">
      <span ${fullStyle}>${"★".repeat(full)}</span>
      <span ${emptyStyle}>${"★".repeat(empty)}</span>
    </span>
  `;
}

function formatRating(n) {
  const x = Number(n) || 0;
  return (Math.round(x * 10) / 10).toString().replace(".", ",");
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

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
