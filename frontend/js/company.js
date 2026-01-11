// frontend/js/company.js
// v2026-01-13 — Company detailpagina
// - Google-reviews (samenvatting) bovenaan
// - Irisje-reviews (lijst) onderaan
// - Review schrijven → review.html?companySlug=...
// - Offerte aanvragen → request.html?companySlug=...

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

/* =========================
   Init
========================= */

async function init() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const fromSector = params.get("fromSector");

  renderBackLink(fromSector);

  if (!slug) {
    renderError("Geen bedrijf opgegeven.");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`
    );
    const data = await res.json();

    if (!res.ok || !data.ok || !data.company) {
      throw new Error("Bedrijf niet gevonden.");
    }

    const company = data.company;

    renderCompany(company);
    await loadIrisjeReviews(company._id);
  } catch (err) {
    console.error(err);
    renderError(err.message || "Fout bij laden bedrijf.");
  }
}

/* =========================
   Reviews (Irisje)
========================= */

async function loadIrisjeReviews(companyId) {
  const container = document.getElementById("companyReviews");
  const empty = document.getElementById("noIrisjeReviews");
  if (!container) return;

  container.innerHTML = "<p class='text-slate-500'>Reviews laden…</p>";
  if (empty) empty.classList.add("hidden");

  try {
    const res = await fetch(
      `${API_BASE}/reviews/company/${encodeURIComponent(companyId)}`
    );
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error("Kon reviews niet laden.");
    }

    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    if (reviews.length === 0) {
      container.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }

    container.innerHTML = "";
    reviews.forEach(review => {
      container.appendChild(renderReview(review));
    });
  } catch (err) {
    console.error(err);
    container.innerHTML =
      "<p class='text-red-600'>Reviews konden niet worden geladen.</p>";
  }
}

function renderReview(review) {
  const div = document.createElement("div");
  div.className = "border rounded-lg p-4 bg-white";

  const rating = Number(review.rating) || 0;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("nl-NL")
    : "";

  div.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <strong>${escapeHtml(review.reviewerName || "Anoniem")}</strong>
      <span class="text-sm text-slate-500">${escapeHtml(date)}</span>
    </div>
    <div class="text-yellow-500 mb-1">${stars}</div>
    <p class="text-slate-700">${escapeHtml(review.comment || "")}</p>
  `;

  return div;
}

/* =========================
   Company UI
========================= */

function renderCompany(company) {
  setText("companyName", company.name);

  setText(
    "companyMeta",
    [company.city, company.isVerified ? "Geverifieerd" : null]
      .filter(Boolean)
      .join(" • ")
  );

  // ⭐ Google-reviews (samenvatting)
  const googleLabel =
    company.reviewCount && company.reviewCount > 0
      ? `⭐ ${Number(company.avgRating || 0).toFixed(1)} (${company.reviewCount} Google-reviews)`
      : "Nog geen Google-reviews";

  setText("companyRating", googleLabel);

  setText(
    "companyAbout",
    company.description || "Geen beschrijving beschikbaar."
  );

  renderDetails(company);
  renderLogo(company);
  renderPremium(company);
  bindReviewButton(company);
  bindRequestButton(company);
}

function renderDetails(company) {
  const ul = document.getElementById("companyDetails");
  if (!ul) return;

  ul.innerHTML = "";

  addLi(ul, "Plaats", company.city || "—");
  addLi(
    ul,
    "Categorieën",
    Array.isArray(company.categories) && company.categories.length
      ? company.categories.join(", ")
      : "—"
  );
  addLi(
    ul,
    "Specialismen",
    Array.isArray(company.specialties) && company.specialties.length
      ? company.specialties.join(", ")
      : "—"
  );
}

function renderLogo(company) {
  const img = document.getElementById("companyLogo");
  const fallback = document.getElementById("companyLogoFallback");
  if (!img || !fallback) return;

  if (company.logoUrl) {
    img.src = company.logoUrl;
    img.cla
