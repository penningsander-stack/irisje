// frontend/js/results.js
// v20251218-RESULTS-STABLE-FIXED

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

  let category = params.get("category") || "";
  const q = params.get("q") || "";
  const city = params.get("city") || "";

  // 🔧 FIX: slug → leesbare categorie
  if (category.includes("-")) {
    category = category
      .split("-")
      .map(w => capitalizeFirst(w))
      .join(" ");
  } else {
    category = capitalizeFirst(category);
  }

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");
  const messageEl = document.getElementById("resultsMessage");

  if (container) container.innerHTML = "";
  if (messageEl) messageEl.innerHTML = "";
  if (skeleton) skeleton.style.display = "grid";

  if (titleEl) {
    if (category && city) {
      titleEl.textContent = `${category} in ${city}`;
    } else if (category) {
      titleEl.textContent = `${category} in jouw regio`;
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

    if (data.message && messageEl) {
      messageEl.innerHTML = `
        <div class="text-sm text-indigo-600 mb-4">
          ${escapeHtml(data.message)}
        </div>
      `;
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
    renderResults();
  } catch (err) {
    console.error("❌ Fout bij laden resultaten:", err);
    if (skeleton) skeleton.style.display = "none";
    container.innerHTML = `
      <div class="text-sm text-red-500">
        Er ging iets mis bij het laden van de resultaten.
      </div>
    `;
  }
}

function normalizeCompany(item) {
  if (!item || typeof item !== "object") return null;

  const email = item.email || "";
  const isGoogleImported =
    email.startsWith("noemail_") && email.endsWith("@irisje.nl");

  return {
    id: item._id,
    name: item.name || "Onbekend bedrijf",
    slug: item.slug || "",
    tagline: item.tagline || "",
    categories: Array.isArray(item.categories) ? item.categories : [],
    city: item.city || "",
    isVerified: Boolean(item.isVerified),
    rating: Number(item.avgRating) || 0,
    reviewCount: Number(item.reviewCount) || 0,
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
  } else if (currentFilters.source === "irisje") {
    list = list.filter(c => !c.isGoogleImported);
  }

  list = sortResults(list, currentFilters.sort);

  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `
      <div class="text-sm text-slate-500">
        Geen bedrijven gevonden met deze filters.
      </div>
    `;
    return;
  }

  list.forEach(c => container.appendChild(buildCompanyCard(c)));
}

function sortResults(list, mode) {
  const arr = [...list];
  switch (mode) {
    case "rating":
      return arr.sort((a, b) => b.rating - a.rating);
    case "reviews":
      return arr.sort((a, b) => b.reviewCount - a.reviewCount);
    case "verified":
      return arr.sort((a, b) => Number(b.isVerified) - Number(a.isVerified));
    case "az":
      return arr.sort((a, b) => a.name.localeCompare(b.name, "nl"));
    default:
      return arr;
  }
}

function buildCompanyCard(c) {
  const stars =
    "★".repeat(Math.round(c.rating)) +
    "☆".repeat(5 - Math.round(c.rating));

  const link = `company.html?slug=${encodeURIComponent(c.slug)}`;

  const el = document.createElement("article");
  el.className = "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-3";

  el.innerHTML = `
    <h2 class="text-base font-semibold">
      <a href="${link}" class="hover:underline">${escapeHtml(c.name)}</a>
    </h2>
    <div class="text-xs text-slate-600">${escapeHtml(c.city)}</div>
    ${
      c.reviewCount
        ? `<div class="text-sm text-amber-500">${stars} (${c.reviewCount})</div>`
        : ""
    }
    ${
      c.isVerified
        ? `<span class="text-xs text-emerald-600">✔ Geverifieerd</span>`
        : ""
    }
    ${
      c.tagline
        ? `<p class="text-sm text-slate-700">${escapeHtml(c.tagline)}</p>`
        : ""
    }
    <a href="${link}" class="btn-primary btn-xs self-start">Bekijk bedrijf</a>
  `;
  return el;
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
