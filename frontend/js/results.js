// frontend/js/results.js
// v2026-01-06 FIX-FALLBACK-WITHOUT-REQUESTID

const API_BASE = "https://irisje-backend.onrender.com/api";

let allCompanies = [];

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const titleEl = document.getElementById("resultsTitle");
  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  try {
    let companies = [];

    // =========================
    // MET requestId → matches
    // =========================
    if (requestId) {
      titleEl.textContent = "Bedrijven voor jouw aanvraag";

      const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        container.innerHTML = "<p>Aanvraag niet gevonden.</p>";
        skeleton.style.display = "none";
        return;
      }

      companies = data.companies || [];
    }

    // =========================
    // ZONDER requestId → fallback
    // =========================
    else {
      titleEl.textContent = "Populaire bedrijven";

      const res = await fetch(`${API_BASE}/publicCompanies`);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        container.innerHTML = "<p>Geen bedrijven beschikbaar.</p>";
        skeleton.style.display = "none";
        return;
      }

      companies = data.companies || [];
    }

    allCompanies = companies;
    skeleton.style.display = "none";
    applyAndRenderResults(!!requestId);

  } catch (err) {
    console.error("❌ results init error:", err);
    skeleton.style.display = "none";
    container.innerHTML = "<p>Fout bij laden van bedrijven.</p>";
  }
}

function applyAndRenderResults(hasRequestContext) {
  const container = document.getElementById("resultsContainer");

  let results = [...allCompanies];

  const minRating = document.getElementById("filterMinRating")?.value || "";
  const verifiedOnly = document.getElementById("filterVerified")?.value || "";
  const source = document.getElementById("filterSource")?.value || "";
  const sort = document.getElementById("sortResults")?.value || "relevance";

  // Filters alleen afdwingen bij aanvraag
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

  // Sorteren
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
      break;
  }

  if (!results.length) {
    container.innerHTML = `
      <div class="col-span-full text-center text-slate-500 py-12">
        Geen bedrijven gevonden.
      </div>
    `;
    return;
  }

  container.innerHTML = results.map(renderCompanyCard).join("");
}

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

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[s]));
}

// Filters opnieuw toepassen
["filterMinRating", "filterVerified", "filterSource", "sortResults"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("change", () => {
      const params = new URLSearchParams(window.location.search);
      applyAndRenderResults(params.has("requestId"));
    });
  }
});
