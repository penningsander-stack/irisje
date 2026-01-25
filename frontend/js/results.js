// frontend/js/results.js
// MODE A: search (category + city + optional specialty)
// MODE B: offer-from-company (anchor company via SLUG + max 4 similar)

document.addEventListener("DOMContentLoaded", init);

const MAX_SELECT = 5;

/* ============================================================
   INIT
   ============================================================ */

async function init() {
  try {
    const params = new URLSearchParams(window.location.search);

    const companySlug = params.get("companySlug");
    const category = params.get("category");
    const city = params.get("city");
    const specialty = params.get("specialty");

    setState("Laden…");

    if (companySlug) {
      await runOfferMode(companySlug);
    } else {
      await runSearchMode(category, city, specialty);
    }

    setState("");

    const checkboxCount = document.querySelectorAll(".company-checkbox").length;
    if (checkboxCount > 0) {
      enableSelectionLimit(MAX_SELECT);
      updateSelectionUI(MAX_SELECT);
    } else {
      hideFooter();
    }
  } catch (err) {
    console.error(err);
    showError("Er ging iets mis bij het laden van de resultaten.");
  }
}

/* ============================================================
   MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF
   ============================================================ */

async function runOfferMode(companySlug) {
  resetCompanies();

  const anchorRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies/slug/${encodeURIComponent(companySlug)}`
  );
  const anchorData = await safeJson(anchorRes);

  if (!anchorRes.ok || !anchorData?.ok || !anchorData?.company) {
    throw new Error(anchorData?.message || "Ankerbedrijf kon niet worden geladen");
  }

  const anchor = anchorData.company;
  renderCompanies([anchor], { isAnchor: true });

  const similarRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`
  );
  const similarData = await safeJson(similarRes);

  if (!similarRes.ok || !similarData?.ok) {
    throw new Error(similarData?.message || "Similar-endpoint faalde");
  }

  const similars = Array.isArray(similarData.companies)
    ? similarData.companies.slice(0, 4)
    : [];

  renderCompanies(similars);
}

/* ============================================================
   MODE A — ZOEKRESULTATEN
   ============================================================ */

async function runSearchMode(category, city, specialty) {
  resetCompanies();

  const url = new URL("https://irisje-backend.onrender.com/api/companies");
  if (category) url.searchParams.set("category", category);
  if (city) url.searchParams.set("city", city);
  if (specialty) url.searchParams.set("specialty", specialty);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await safeJson(res);

  if (!res.ok || !data?.ok || !Array.isArray(data.companies)) {
    throw new Error(data?.message || "Zoekresultaten konden niet worden geladen");
  }

  renderCompanies(data.companies);
}

/* ============================================================
   RENDERING
   ============================================================ */

function resetCompanies() {
  const list = document.getElementById("companiesList");
  if (list) list.innerHTML = "";
  hideFooter();
}

function renderCompanies(companies, options = {}) {
  const container = document.getElementById("companiesList");
  if (!container) return;

  if (!Array.isArray(companies) || companies.length === 0) {
    setState("Geen geschikte bedrijven gevonden.");
    hideFooter();
    return;
  }

  companies.forEach((company) => {
    const card = document.createElement("div");
    card.className = "result-card";
    if (options.isAnchor) card.classList.add("best-match");

    const reviewHtml = buildReviewsHtml(company);

    card.innerHTML = `
      <div class="result-card-inner">
        ${options.isAnchor ? `<div class="badge">Beste match</div>` : ""}

        <div class="result-card-main">
          <h3 class="result-title">${escapeHtml(company.name)}</h3>
          ${reviewHtml}
          <p class="muted">${escapeHtml(company.city || "")}</p>
        </div>

        <label class="result-select">
          <input type="checkbox" class="company-checkbox" value="${escapeHtml(company._id)}">
          <span>Selecteer</span>
        </label>
      </div>
    `;

    container.appendChild(card);
  });

  showFooter();
}

/* ============================================================
   REVIEWS + STERREN (GEFIXT)
   ============================================================ */

function buildReviewsHtml(company) {
  const parts = [];

  if (company.googleReviewCount > 0) {
    parts.push(renderRatingRow("Google", company.googleRating, company.googleReviewCount));
  }

  if (company.reviewCount > 0) {
    parts.push(renderRatingRow("Irisje", company.avgRating, company.reviewCount));
  }

  if (parts.length === 0) return "";

  return `<div class="reviews-block">${parts.join("")}</div>`;
}

function renderRatingRow(source, rating, count) {
  return `
    <div class="rating-row">
      <span class="rating-source">${source}</span>
      <span class="rating-stars-fixed">
        ${renderStars(rating)}
      </span>
      <span class="rating-value">${formatRating(rating)}</span>
      <span class="rating-count">(${count})</span>
    </div>
  `;
}

function renderStars(rating) {
  const r = clamp(Number(rating), 0, 5);
  const full = Math.floor(r);
  const half = r - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    svgStar("full").repeat(full) +
    (half ? svgStar("half") : "") +
    svgStar("empty").repeat(empty)
  );
}

function svgStar(type) {
  const path = "M10 15.27l-5.18 3.05 1.4-5.98L1.5 8.63l6.08-.52L10 2.5l2.42 5.61 6.08.52-4.72 3.71 1.4 5.98z";

  if (type === "half") {
    return `
      <svg class="star" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stop-color="currentColor"/>
            <stop offset="50%" stop-color="transparent"/>
          </linearGradient>
        </defs>
        <path fill="url(#half)" d="${path}"></path>
        <path fill="none" stroke="currentColor" d="${path}"></path>
      </svg>`;
  }

  return `
    <svg class="star" viewBox="0 0 20 20">
      <path ${type === "full" ? `fill="currentColor"` : `fill="none" stroke="currentColor"`} d="${path}"></path>
    </svg>`;
}

/* ============================================================
   SELECTIE + FOOTER
   ============================================================ */

function enableSelectionLimit(max) {
  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("company-checkbox")) return;

    const checked = document.querySelectorAll(".company-checkbox:checked");
    if (checked.length > max) {
      e.target.checked = false;
      alert(`Je kunt maximaal ${max} bedrijven selecteren.`);
    }
    updateSelectionUI(max);
  });
}

function updateSelectionUI(max) {
  const checked = document.querySelectorAll(".company-checkbox:checked").length;
  const footer = document.getElementById("resultsFooter");
  const selectedCount = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");

  if (selectedCount) selectedCount.textContent = `${checked} van ${max} geselecteerd`;
  if (footer) footer.classList.remove("hidden");
  if (sendBtn) sendBtn.disabled = checked === 0;
}

function showFooter() {
  const footer = document.getElementById("resultsFooter");
  if (footer) footer.classList.remove("hidden");
}

function hideFooter() {
  const footer = document.getElementById("resultsFooter");
  if (footer) footer.classList.add("hidden");
}

/* ============================================================
   HELPERS
   ============================================================ */

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m])
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatRating(r) {
  const n = clamp(Number(r), 0, 5);
  return n.toFixed(1).replace(".", ",");
}
