// frontend/js/results.js
// v20251213-RESULTS-FIX-LIMIT-SORT

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initSearchResults();
});

async function initSearchResults() {
  const params = new URLSearchParams(window.location.search);

  const category = params.get("category") || "";
  const q = params.get("q") || "";
  const city = params.get("city") || "";

  // Titel aanpassen
  const header = document.getElementById("resultsTitle");
  if (header) {
    if (category) header.textContent = `Categorie: ${category}`;
    else if (q) header.textContent = `Zoekresultaten voor: ${q}`;
    else header.textContent = "Zoekresultaten";
  }

  renderLoading();

  try {
    const url = new URL(`${API_BASE}/companies/search`);

    if (category) url.searchParams.set("category", category);
    if (q) url.searchParams.set("q", q);
    if (city) url.searchParams.set("city", city);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Foutstatus ${res.status}`);

    const data = await res.json();

    if (!data.ok || !Array.isArray(data.items)) {
      throw new Error("Ongeldige backend response");
    }

    if (data.items.length === 0) {
      renderNoResults();
    } else {
      renderCompanies(data.items);
    }
  } catch (err) {
    console.error("❌ Fout bij ophalen zoekresultaten:", err);
    renderError();
  }
}

function hideSkeleton() {
  const skeleton = document.getElementById("resultsSkeleton");
  if (skeleton) skeleton.style.display = "none";
}

function renderLoading() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full text-center text-slate-400 text-sm py-4">
      Resultaten worden geladen…
    </div>
  `;
}

function renderNoResults() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  hideSkeleton();

  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="text-5xl mb-3">🔍</div>
      <div class="text-slate-500">Geen bedrijven gevonden.</div>
    </div>
  `;
}

function renderError() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  hideSkeleton();

  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="text-5xl mb-3">⚠️</div>
      <div class="text-slate-500">Er ging iets mis bij het laden van de resultaten.</div>
    </div>
  `;
}

function renderCompanies(items) {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  hideSkeleton();
  container.innerHTML = "";

  // Filter incomplete records
  const cleaned = items.filter(
    (item) =>
      item &&
      item.name &&
      item.name.trim() !== "" &&
      item.slug &&
      item.slug.trim() !== ""
  );

  if (cleaned.length === 0) {
    renderNoResults();
    return;
  }

  // Check if full results must be shown
  const params = new URLSearchParams(window.location.search);
  const fullMode = params.get("full") === "1";

  const LIMIT = 9;
  const listToShow = fullMode ? cleaned : cleaned.slice(0, LIMIT);

  listToShow.forEach((item) => {
    const name = item.name || "(Bedrijfsnaam onbekend)";
    const city = item.city || "";

    let cats = Array.isArray(item.categories) ? item.categories : [];
    cats = cats
      .map((c) => (c || "").trim())
      .filter((c) => c !== "" && c.length > 1);

    let categoryDisplay = cats.slice(0, 2).join(", ");
    if (cats.length > 2) {
      categoryDisplay += ` (+${cats.length - 2})`;
    }

    const slug = item.slug;

    const card = document.createElement("a");
    card.href = `company.html?slug=${encodeURIComponent(slug)}`;
    card.className =
      "surface-card p-4 rounded-2xl shadow-sm hover:shadow-md transition block";

    card.innerHTML = `
      <div class="text-lg font-semibold mb-1 text-slate-800">${name}</div>
      <div class="text-sm text-slate-600 truncate">${categoryDisplay}</div>
      <div class="text-sm text-slate-500">${city}</div>
    `;

    container.appendChild(card);
  });

  // Show button to view all results if not in full mode
  if (!fullMode && cleaned.length > LIMIT) {
    const btn = document.createElement("a");

    const baseParams = new URLSearchParams(window.location.search);
    baseParams.set("full", "1");

    btn.href = window.location.pathname + "?" + baseParams.toString();
    btn.className =
      "col-span-full text-center text-indigo-600 mt-4 text-sm underline block";
    btn.textContent = `Toon alle resultaten (${cleaned.length})`;
    container.appendChild(btn);
  }
}
