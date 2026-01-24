// frontend/js/results.js
// MODE A: search (category + city)
// MODE B: offer-from-company (anchor company via SLUG + max 4 similar)

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(window.location.search);

  const companySlug = params.get("companySlug"); // SLUG-ONLY
  const category = params.get("category");
  const city = params.get("city");

  if (companySlug) {
    await runOfferMode(companySlug);
  } else {
    await runSearchMode(category, city);
  }
}

/* ============================================================
   MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF (SLUG)
   ============================================================ */

async function runOfferMode(companySlug) {
  try {
    // 1) haal ankerbedrijf op via SLUG
    const anchorRes = await fetch(
      `https://irisje-backend.onrender.com/api/companies/slug/${encodeURIComponent(companySlug)}`
    );
    const anchorData = await anchorRes.json();

    if (!anchorData || !anchorData._id) {
      throw new Error("Ankerbedrijf kon niet worden geladen");
    }

    const anchor = anchorData;

    // 2) render ankerbedrijf als eerste (Beste match)
    renderCompanies([anchor], { isAnchor: true });

    // 3) haal vergelijkbare bedrijven op via similar-endpoint
    const similarRes = await fetch(
      `https://irisje-backend.onrender.com/api/companies/similar?anchorSlug=${encodeURIComponent(anchor.slug)}`
    );
    const similarData = await similarRes.json();

    if (!similarData.ok) {
      throw new Error(similarData.message || "Similar-endpoint faalde");
    }

    const similars = Array.isArray(similarData.companies)
      ? similarData.companies.slice(0, 4)
      : [];

    // 4) render vergelijkbare bedrijven
    renderCompanies(similars, { isAnchor: false });

    // 5) activeer selectiebeperking (max 5)
    enableSelectionLimit(5);

  } catch (err) {
    console.error(err);
    showError("Er ging iets mis bij het laden van de offerte-selectie.");
  }
}

/* ============================================================
   MODE A — ZOEKRESULTATEN (CATEGORY + CITY)
   ============================================================ */

async function runSearchMode(category, city) {
  try {
    const url = new URL("https://irisje-backend.onrender.com/api/companies");
    if (category) url.searchParams.set("category", category);
    if (city) url.searchParams.set("city", city);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.companies)) {
      throw new Error("Zoekresultaten konden niet worden geladen");
    }

    renderCompanies(data.companies, { isAnchor: false });

  } catch (err) {
    console.error(err);
    showError("Er ging iets mis bij het laden van de zoekresultaten.");
  }
}

/* ============================================================
   RENDERING
   ============================================================ */

function renderCompanies(companies, options = {}) {
  const container = document.getElementById("companies");
  if (!container) return;

  companies.forEach(company => {
    const card = document.createElement("div");
    card.className = "company-card";

    if (options.isAnchor) {
      card.classList.add("best-match");
    }

    card.innerHTML = `
      ${options.isAnchor ? `<div class="badge">Beste match</div>` : ""}
      <h3>${company.name}</h3>
      <p>${company.city}</p>
      <label>
        <input type="checkbox" class="company-checkbox" value="${company._id}">
        Selecteer
      </label>
    `;

    container.appendChild(card);
  });
}

/* ============================================================
   SELECTIEBEPERKING
   ============================================================ */

function enableSelectionLimit(max) {
  document.addEventListener("change", e => {
    if (!e.target.classList.contains("company-checkbox")) return;

    const checked = document.querySelectorAll(".company-checkbox:checked");

    if (checked.length > max) {
      e.target.checked = false;
      alert(`Je kunt maximaal ${max} bedrijven selecteren.`);
    }
  });
}

/* ============================================================
   FOUTMELDING
   ============================================================ */

function showError(message) {
  const container = document.getElementById("companies");
  if (!container) return;

  container.innerHTML = `<p class="error">${message}</p>`;
}
