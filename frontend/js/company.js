// frontend/js/company.js
// v20260101-COMPANY-REVIEWS-INTEGRATION
//
// Verantwoordelijkheden:
// - Bedrijf laden via slug
// - Reviews laden via companyId
// - Alleen approved reviews tonen

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompanyPage);

async function initCompanyPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    console.error("[company] Geen slug in URL");
    return;
  }

  try {
    const company = await loadCompany(slug);
    renderCompany(company);

    // 👉 NIEUW: reviews laden op basis van companyId
    await loadAndRenderReviews(company._id);
  } catch (err) {
    console.error("[company] Fout bij laden bedrijfspagina:", err);
  }
}

// ------------------------
// Bedrijf laden
// ------------------------
async function loadCompany(slug) {
  const res = await fetch(`${API_BASE}/companies/slug/${slug}`);
  const data = await res.json();

  if (!data.ok || !data.item) {
    throw new Error("Bedrijf niet gevonden");
  }

  return data.item;
}

function renderCompany(company) {
  const titleEl = document.getElementById("companyName");
  if (titleEl) {
    titleEl.textContent = company.name;
  }

  // Andere bestaande rendering blijft intact
}

// ------------------------
// Reviews laden + renderen
// ------------------------
async function loadAndRenderReviews(companyId) {
  const container = document.getElementById("reviewsContainer");

  if (!container) {
    console.warn("[company] reviewsContainer niet gevonden in DOM");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/reviews/company/${companyId}`
    );
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.reviews)) {
      container.innerHTML = "<p>Reviews konden niet worden geladen.</p>";
      return;
    }

    if (data.reviews.length === 0) {
      container.innerHTML = "<p>Nog geen reviews.</p>";
      return;
    }

    container.innerHTML = data.reviews
      .map(renderReview)
      .join("");
  } catch (err) {
    console.error("[company] Fout bij laden reviews:", err);
    container.innerHTML = "<p>Fout bij laden van reviews.</p>";
  }
}

function renderReview(review) {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

  return `
    <div class="review border rounded-lg p-4 mb-4 bg-white">
      <div class="flex items-center justify-between mb-2">
        <strong>${escapeHtml(review.reviewerName)}</strong>
        <span class="text-yellow-500">${stars}</span>
      </div>
      <p class="text-gray-700">
        ${escapeHtml(review.comment)}
      </p>
    </div>
  `;
}

// ------------------------
// Helpers
// ------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
