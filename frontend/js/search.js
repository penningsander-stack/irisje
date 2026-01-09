// frontend/js/search.js
const API_BASE = "https://irisje-backend.onrender.com/api";

let allCompanies = [];
let allCategories = [];
let activeSubcategory = null;
let activeCategory = null;

document.addEventListener("DOMContentLoaded", initSearch);

async function initSearch() {
  const params = new URLSearchParams(window.location.search);
  activeCategory = params.get("category");

  if (!activeCategory) {
    document.getElementById("searchTitle").textContent =
      "Geen categorie gekozen";
    return;
  }

  document.getElementById("searchTitle").textContent =
    `Bedrijven binnen ${activeCategory}`;

  try {
    const [companiesRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/companies/search?category=${encodeURIComponent(activeCategory)}`),
      fetch(`${API_BASE}/categories`)
    ]);

    allCompanies = await companiesRes.json();
    allCategories = await categoriesRes.json();

    renderSubcategories();
    renderCompanies(allCompanies);
    updateResultCount(allCompanies.length);
  } catch (err) {
    console.error("Zoekresultaten laden mislukt", err);
  }
}

function renderSubcategories() {
  const subcats = allCategories.filter(
    c => c.parentCategory === activeCategory
  );

  if (!subcats.length) return;

  const section = document.getElementById("subcategories");
  const container = document.getElementById("subcategoryChips");

  section.classList.remove("hidden");
  container.innerHTML = "";

  subcats.forEach(sub => {
    const btn = document.createElement("button");
    btn.className = "subcat-chip";
    btn.textContent = sub.name;

    if (sub.name === activeSubcategory) {
      btn.classList.add("active");
    }

    btn.onclick = () => {
      activeSubcategory =
        activeSubcategory === sub.name ? null : sub.name;
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

  if (!companies.length) {
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
      <a
        href="company.html?id=${c._id}"
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
