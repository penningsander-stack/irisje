// frontend/js/company.js
// v20260101-COMPANY-REVIEWS-TRANSITION-B
//
// Overgangsvriendelijk:
// - nieuwe reviews: status === "approved"
// - oude reviews: isConfirmed === true

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyPage();
});

async function initCompanyPage() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return;

  try {
    // 1) Bedrijf ophalen
    const companyRes = await fetch(`${API_BASE}/companies/slug/${slug}`);
    const companyData = await companyRes.json();
    if (!companyData.ok) throw new Error("Bedrijf niet gevonden");

    const company = companyData.item;
    renderCompany(company);

    // 2) Reviews ophalen
    const reviewsRes = await fetch(
      `${API_BASE}/reviews/company/${company._id}`
    );
    const reviewsData = await reviewsRes.json();
    if (!reviewsData.ok) throw new Error("Reviews konden niet worden geladen");

    // 🔧 OVERGANGSFILTER (OPTIE B)
    const visibleReviews = (reviewsData.reviews || []).filter(
      r => r.status === "approved" || r.isConfirmed === true
    );

    renderReviews(visibleReviews);

  } catch (err) {
    console.error("[company] init error:", err);
  }
}

function renderCompany(company) {
  const nameEl = document.getElementById("companyName");
  if (nameEl) nameEl.textContent = company.name || "";

  const logoEl = document.getElementById("companyLogo");
  if (logoEl && company.logo) {
    logoEl.src = company.logo;
    logoEl.alt = company.name;
  }
}

function renderReviews(reviews) {
  const listEl = document.getElementById("reviewsList");
  if (!listEl) return;

  listEl.innerHTML = "";

  if (!reviews.length) {
    listEl.innerHTML =
      `<p class="text-sm text-slate-500">Nog geen reviews.</p>`;
    return;
  }

  reviews.forEach(r => {
    const item = document.createElement("div");
    item.className = "review-item";

    item.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <strong>${escapeHtml(r.reviewerName)}</strong>
        <span class="text-yellow-500">${"★".repeat(r.rating)}</span>
      </div>
      <p class="text-sm text-slate-700">${escapeHtml(r.comment)}</p>
    `;

    listEl.appendChild(item);
  });
}

function escapeHtml(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
