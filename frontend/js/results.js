// frontend/js/results.js
// v20260104-results-final-hard-guard

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  let url;

  // 🔒 HARD GUARD
  // Alleen zoeken ALS er een requestId is
  if (requestId && requestId.trim().length > 0) {
    const sp = new URLSearchParams();
    sp.set("requestId", requestId);
    url = `${API_BASE}/companies/search?${sp.toString()}`;

    setHeader(
      "Bedrijven voor jouw aanvraag",
      "Selecteer maximaal vijf bedrijven om je aanvraag te versturen."
    );
  } else {
    // 🔁 ALTIJD fallback
    url = `${API_BASE}/publicCompanies`;

    setHeader(
      "Populaire bedrijven",
      "Bekijk bedrijven of start een aanvraag om gericht te zoeken."
    );
  }

  try {
    const data = await safeJsonFetch(url);
    const companies = Array.isArray(data?.companies)
      ? data.companies
      : Array.isArray(data)
      ? data
      : [];

    renderResults(companies);
  } catch (err) {
    console.error("❌ Resultaten fout:", err);
    renderEmpty();
  }
}

function setHeader(title, subtitle) {
  const t = document.getElementById("resultsTitle");
  const s = document.querySelector(".section-shell p");
  if (t) t.textContent = title;
  if (s) s.textContent = subtitle;
}

function renderResults(companies) {
  const grid = document.getElementById("resultsContainer");
  const skeleton = document.getElementById("resultsSkeleton");

  if (skeleton) skeleton.style.display = "none";
  if (!grid) return;

  grid.innerHTML = "";

  if (!companies.length) {
    renderEmpty();
    return;
  }

  companies.forEach((c) => {
    const el = document.createElement("div");
    el.className = "surface-card p-5 rounded-2xl shadow-soft flex flex-col gap-2";

    el.innerHTML = `
      <h3 class="font-semibold text-slate-900">${c.name}</h3>
      ${c.avgRating ? `<div class="text-sm">⭐ ${c.avgRating} (${c.reviewCount || 0})</div>` : ""}
      ${c.city ? `<div class="text-sm text-slate-500">${c.city}</div>` : ""}
      <a href="/company.html?company=${c._id}" class="btn mt-auto">Bekijk bedrijf</a>
    `;

    grid.appendChild(el);
  });
}

function renderEmpty() {
  const grid = document.getElementById("resultsContainer");
  const skeleton = document.getElementById("resultsSkeleton");

  if (skeleton) skeleton.style.display = "none";
  if (!grid) return;

  grid.innerHTML = "<p>Geen bedrijven gevonden.</p>";
}

async function safeJsonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
