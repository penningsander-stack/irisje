// frontend/js/company.js
// v2026-01-11 — Stap N: reviewbronnen scheiden (Google vs Irisje)
// - Bovenaan: Google-reviews labelen
// - Onder: "Reviews op Irisje.nl" + Irisje-reviews

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

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

    // Irisje-reviews laden
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
    reviews.forEach(r => container.appendChild(renderReview(r)));
  } catch (err) {
    console.error(err);
    container.innerHTML =
      "<p class='text-red-600'>Reviews konden niet worden geladen.</p>";
  }
}

function renderReview(review) {
  const div = document.createElement("div");
  div.className = "border rounded-lg p-4 bg-white";

  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
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
   UI helpers
========================= */

function renderBackLink(fromSector) {
  const hero = document.getElementById("companyHero");
  if (!hero) return;

  const a = document.createElement("a");
  a.className =
    "inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-3";
  a.href = fromSector
    ? `results.html?sector=${encodeURIComponent(fromSector)}`
    : "results.html";
  a.innerHTML = "← Terug naar resultaten";

  hero.prepend(a);
}

function renderCompany(company) {
  setText("companyName", company.name);

  setText(
    "companyMeta",
    [company.city, company.isVerified ? "Geverifieerd" : null]
      .filter(Boolean)
      .join(" • ")
  );

  // ⭐ Google-reviews expliciet labelen (Trustoo-stijl)
  const googleLabel = company.reviewCount
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

function addLi(ul, label, value) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`;
  ul.appendChild(li);
}

function renderLogo(company) {
  const img = document.getElementById("companyLogo");
  const fallback = document.getElementById("companyLogoFallback");
  if (!img || !fallback) return;

  if (company.logoUrl) {
    img.src = company.logoUrl;
    img.classList.remove("hidden");
    fallback.classList.add("hidden");
  } else {
    fallback.textContent = getInitials(company.name);
    fallback.classList.remove("hidden");
    img.classList.add("hidden");
  }
}

function renderPremium(company) {
  const badge = document.getElementById("premiumBadge");
  if (!badge) return;
  company.isPremium
    ? badge.classList.remove("hidden")
    : badge.classList.add("hidden");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function renderError(msg) {
  const hero = document.getElementById("companyHero");
  if (!hero) return;
  hero.innerHTML = `<div class="text-red-600">${escapeHtml(msg)}</div>`;
}

/* =========================
   Utils
========================= */

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
