// frontend/js/results.js
// v20260104-FIX-POPULAR-COMPANIES
//
// Resultatenpagina Irisje.nl
// - Zonder requestId: toont populaire bedrijven (GEEN verplichte filters)
// - Met requestId: past filters strikt toe
// - Voorkomt 400-fouten + lege resultaten door onterechte filtering

const API_BASE = "https://irisje-backend.onrender.com/api";

let allCompanies = [];

document.addEventListener("DOMContentLoaded", () => {
  initResults();
});

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  try {
    // 🔹 Titel + endpoint bepalen
    let url = `${API_BASE}/publicCompanies`;

    if (requestId) {
      titleEl.textContent = "Bedrijven voor jouw aanvraag";
      url += `?requestId=${encodeURIComponent(requestId)}`;
    } else {
      titleEl.textContent = "Populaire bedrijven";
    }

    const data = await safeJsonFetch(url);

    allCompanies = data.companies || [];

    skeleton.style.display = "none";

    applyAndRenderResults(!!requestId);
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    skeleton.style.display = "none";
    renderEmpty();
  }
}

function applyAndRenderResults(hasRequestContext) {
  const container = document.getElementById("resultsContainer");

  const minRating = document.getElementById("filterMinRating")?.value || "";
  const verifiedOnly = document.getElementById("filterVerified")?.value || "";
  const source = document.getElementById("filterSource")?.value || "";
  const sort = document.getElementById("sortResults")?.value || "relevance";

  let results = [...allCompanies];

  // ✅ FILTERS ALLEEN AFDWINGEN BIJ AANVRAAG
  if (hasRequestContext) {
    if (minRating) {
      results = results.filter(c => (c.avgRating || 0) >= Number(minRating));
    }

    if (verifiedOnly === "yes") {
      results = results.filter(c => c.isVerified === true);
    }

    if (source) {
      results = results.filter(c => c.reviewSource === source);
    }
  }

  // 🔹 Sorteren
  switch (sort) {
    case "rating":
      results.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      break;
    case "reviews":
      results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      break;
    case "verified":
      results.sort((a, b) => (b.isVerified === true) - (a.isVerified === true));
      break;
    case "az":
      results.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    default:
      // relevance / standaard → niets doen
      break;
  }

  if (!results.length) {
    renderEmpty();
    return;
  }

  container.innerHTML = results.map(renderCompanyCard).join("");
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
>>>>>>> parent of de64fcc (Diversen)
function renderCompanyCard(company) {
  const rating = company.avgRating ? company.avgRating.toFixed(1) : "—";
  const reviews = company.reviewCount || 0;

  return `
    <div class="surface-card p-5 rounded-2xl shadow-soft flex flex-col justify-between">
      <div>
        <h3 class="font-semibold text-slate-900 mb-1">${escapeHtml(company.name)}</h3>
        <div class="text-sm text-slate-600 mb-2">
          ${rating} (${reviews} reviews)
        </div>
        ${company.isVerified ? `<span class="badge-verified">Geverifieerd</span>` : ``}
      </div>
      <a href="company.html?company=${company._id}"
         class="mt-4 inline-flex justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
        Bekijk bedrijf
      </a>
    </div>
  `;
}

function renderEmpty() {
  const container = document.getElementById("resultsContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full text-center text-slate-500 py-12">
      Geen bedrijven gevonden.
    </div>
  `;
}

async function safeJsonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}

// 🔹 Filters opnieuw toepassen bij wijziging
["filterMinRating", "filterVerified", "filterSource", "sortResults"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("change", () => {
      const params = new URLSearchParams(window.location.search);
      applyAndRenderResults(params.has("requestId"));
    });
  }
});
<<<<<<< HEAD
>>>>>>> parent of de64fcc (Diversen)
=======
>>>>>>> parent of de64fcc (Diversen)
