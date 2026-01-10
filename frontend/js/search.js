// frontend/js/search.js
// v20260115-SEARCH-CATEGORY-PARAM-FIX

const API_BASE = "https://irisje-backend.onrender.com/api";

let allCompanies = [];
let activeSubcategory = null;

document.addEventListener("DOMContentLoaded", initSearch);

async function initSearch() {
  const params = new URLSearchParams(window.location.search);
  const rawTerm = params.get("category");

  const titleEl = document.getElementById("searchTitle");

  if (!rawTerm) {
    titleEl.textContent = "Geen categorie gekozen";
    return;
  }

  titleEl.textContent = `Bedrijven binnen ${rawTerm}`;

  // normaliseren voor backend
  const normalized = rawTerm.toLowerCase();

  try {
    // ✅ JUISTE backend-parameter: category
    let res = await fetch(
      `${API_BASE}/companies/search?category=${encodeURIComponent(normalized)}`
    );
    let json = await res.json();

    let results = Array.isArray(json.results) ? json.results : [];

    // fallback: zoeken op specialisme
    if (results.length === 0) {
      res = await fetch(
        `${API_BASE}/companies/search?specialty=${encodeURIComponent(normalized)}`
      );
      json = await res.json();
      results = Array.isArray(json.results) ? json.results : [];
    }

    allCompanies = results;

    renderSubcategoriesFromCompanies(allCompanies);
    renderCompanies(allCompanies);
    updateResultCount(allCompanies.length);
  } catch (err) {
    console.error("Zoekresultaten laden mislukt", err);
  }
}

/* subcategorieën = specialties[] */
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
  }

  renderCompanies(filtered);
  updateResultCount(filtered.length);
}

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
      <h3 class="font-semibold text-slate-900 mb-1">${c.name}</h3>
      <p class="text-sm text-slate-600 mb-2">${c.city || ""}</p>
      <a href="company.html?id=${c._id}"
         class="text-sm text-indigo-600 hover:underline">
         Bekijk profiel
      </a>
    `;

    grid.appendChild(card);
  });
}

function updateResultCount(count) {
  document.getElementById("resultCount").textContent =
    count === 1 ? "1 bedrijf gevonden" : `${count} bedrijven gevonden`;
}
