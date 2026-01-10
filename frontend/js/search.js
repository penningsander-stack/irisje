// frontend/js/search.js

const API_BASE = "https://irisje-backend.onrender.com/api";
let allCompanies = [];
let activeSubcategory = null;

document.addEventListener("DOMContentLoaded", initSearch);

async function initSearch() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("category");

  const titleEl = document.getElementById("searchTitle");
  if (!raw) {
    titleEl.textContent = "Geen categorie gekozen";
    return;
  }
  titleEl.textContent = `Bedrijven binnen ${raw}`;

  const normalized = raw.toLowerCase();

  try {
    let res = await fetch(`${API_BASE}/companies/search?category=${encodeURIComponent(normalized)}`);
    let json = await res.json();
    let results = Array.isArray(json.results) ? json.results : [];

    if (!results.length) {
      res = await fetch(`${API_BASE}/companies/search?specialty=${encodeURIComponent(normalized)}`);
      json = await res.json();
      results = Array.isArray(json.results) ? json.results : [];
    }

    allCompanies = results;
    renderCompanies(allCompanies);
    updateResultCount(allCompanies.length);
  } catch (e) {
    console.error("Zoekfout", e);
  }
}

function renderCompanies(companies) {
  const grid = document.getElementById("resultsGrid");
  grid.innerHTML = "";

  if (!companies.length) {
    grid.innerHTML = "<p class='text-slate-600'>Geen bedrijven gevonden.</p>";
    return;
  }

  companies.forEach(c => {
    const card = document.createElement("div");
    card.className = "rounded-2xl bg-white shadow-sm border border-slate-200 p-5";
    card.innerHTML = `
      <h3 class="font-semibold text-slate-900 mb-1">${c.name}</h3>
      <p class="text-sm text-slate-600 mb-2">${c.city || ""}</p>
      <a href="company.html?slug=${encodeURIComponent(c.slug)}"
         class="text-sm text-indigo-600 hover:underline">
         Bekijk profiel
      </a>
    `;
    grid.appendChild(card);
  });
}

function updateResultCount(n) {
  document.getElementById("resultCount").textContent =
    n === 1 ? "1 bedrijf gevonden" : `${n} bedrijven gevonden`;
}
