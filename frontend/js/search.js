// frontend/js/search.js
// v20260114-SEARCH-CATEGORY-SPECIALTY-SYNONYMS

const API_BASE = "https://irisje-backend.onrender.com/api";

/**
 * Synoniemen / vertalingen van zoektermen naar echte categorieën
 */
const CATEGORY_SYNONYMS = {
  "Advocaat": "Juridisch",
  "Advocaten": "Juridisch",
  "Jurist": "Juridisch",
  "Juridisch": "Juridisch"
};

let allCompanies = [];
let activeSubcategory = null;
let searchTerm = null;

document.addEventListener("DOMContentLoaded", initSearch);

async function initSearch() {
  const params = new URLSearchParams(window.location.search);
  searchTerm = params.get("category");

  const titleEl = document.getElementById("searchTitle");

  if (!searchTerm) {
    titleEl.textContent = "Geen categorie gekozen";
    return;
  }

  titleEl.textContent = `Bedrijven binnen ${searchTerm}`;

  // 🔁 Vertaal synoniemen indien nodig
  const mappedCategory = CATEGORY_SYNONYMS[searchTerm] || searchTerm;

  try {
    // 1️⃣ Probeer als hoofdcategorie
    let res = await fetch(
      `${API_BASE}/companies/search?category=${encodeURIComponent(mappedCategory)}`
    );
    let data = await res.json();

    // 2️⃣ Geen resultaten? Dan als specialisme
    if (Array.isArray(data) && data.length === 0) {
      res = await fetch(
        `${API_BASE}/companies/search?specialty=${encodeURIComponent(searchTerm)}`
      );
      data = await res.json();
    }

    allCompanies = Array.isArray(data) ? data : [];

    renderSubcategoriesFromCompanies(allCompanies);
    renderCompanies(allCompanies);
    updateResultCount(allCompanies.length);
  } catch (err) {
    console.error("Zoekresultaten laden mislukt", err);
  }
}

/**
 * Subcategorieën afleiden uit company.specialties[]
 */
function renderSubcategoriesFromCompanies(companies) {
  const section = document.getElementById("subcategories");
  const container = document.getElementById("subcategoryChips");

  if (!Array.isArray(companies) || companies.length === 0) return;

  const specialties = new Set();

  companies.forEach(c => {
    if (Array.isArray(c.specialties)) {
      c.specialties.forEach(s => specialties.add(s));
    }
  });

  if (specialties.size === 0) return;

  section.classList.remove("hidden");
  container.innerHTML = "";

  [...specialties].sort().forEach(name => {
    const btn = document.createElement("button");
    btn.className = "subcat-chip";
    btn.textContent = name;

    if (name === activeSubcategory) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      activeSubcategory =
        activeSubcategory === name ? null : name;
      applyFilters();
    };

    container.appendChild(btn);
  });
}

function applyFilters() {
  let filtered = allCompanies;

  if (activeSubcategory) {
    filtered = filtered.filter(c =>
      Array.isArray(c.specialties) &&
      c.specialties.includes(activeSubcategory)
    );
    document.getElementById("clearSubcat").classList.remove("hidden");
  } else {
    document.getElementById("clearSubcat").classList.add("hidden");
  }

  renderCompanies(filtered);
  updateResultCount(filtered.length);
}

document.getElementById("clearSubcat").onclick = () => {
  activeSubcategory = null;
  applyFilters();
};

function renderCompanies(companies) {
  const grid = document.getElementById("resultsGrid");
  grid.innerHTML = "";

  if (!companies || companies.length === 0) {
    grid.innerHTML =
      "<p class='text-slate-600'>Geen bedrijven gevonden.</p>";
    return;
  }

  companies.forEach(c => {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl bg-white shadow-sm border border-slate-200 p-5";

    card.innerHTML = `
      <h3 class="font-semibold text-slate-900 mb-1">
        ${c.name}
      </h3>
      <p class="text-sm text-slate-600 mb-2">
        ${c.city || ""}
      </p>
      <a href="company.html?id=${c._id}"
         class="text-sm text-indigo-600 hover:underline">
         Bekijk profiel
      </a>
    `;

    grid.appendChild(card);
  });
}

function updateResultCount(count) {
  const el = document.getElementById("resultCount");
  el.textContent =
    count === 1
      ? "1 bedrijf gevonden"
      : `${count} bedrijven gevonden`;
}
