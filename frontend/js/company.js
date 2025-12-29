// frontend/js/company.js
// v20251229-COMPANY-HERO-RATING-FINAL
//
// - Laadt bedrijf via slug
// - Toont logo (alleen als aanwezig)
// - Toont rating + reviewCount in hero
// - Gele sterren (#f59e0b)
// - Reviews laden via company _id
// - Geen backend-wijzigingen
// - Geen placeholders / geen 404's

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompany();
});

/* =========================
   INIT
========================= */
async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    console.error("❌ slug ontbreekt");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const company = data?.item || data;

    if (!company) throw new Error("Geen company data");

    renderHero(company);
    renderDetails(company);
    loadReviews(company._id);
  } catch (err) {
    console.error("❌ Company load error:", err);
  }
}

/* =========================
   HERO
========================= */
function renderHero(c) {
  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const ratingEl = document.getElementById("companyRating");
  const logoEl = document.getElementById("companyLogo");
  const logoWrap = document.getElementById("companyLogoWrap");
  const badgeEl = document.getElementById("premiumBadge");

  if (nameEl) {
    nameEl.textContent = c.name || "Onbekend bedrijf";
  }

  if (metaEl) {
    const cat =
      Array.isArray(c.categories) && c.categories.length
        ? c.categories[0]
        : "";
    metaEl.textContent = [c.city, cat].filter(Boolean).join(" · ");
  }

  // ✅ Logo: alleen tonen als het bestaat
  if (logoEl && logoWrap) {
    if (c.logo) {
      logoEl.src = c.logo;
    } else {
      logoWrap.classList.add("hidden");
    }
  }

  // Premium badge
  if (badgeEl && c.isPremium) {
    badgeEl.classList.remove("hidden");
  }

  // ⭐ Rating + reviewcount
  if (ratingEl) {
    ratingEl.innerHTML = renderHeroRating(
      Number(c.avgRating) || 0,
      Number(c.reviewCount) || 0,
      Boolean(c.isVerified)
    );
  }
}

function renderHeroRating(avg, count, verified) {
  if (!count || count < 1) {
    return `<div class="text-sm text-slate-500">Nog geen reviews</div>`;
  }

  const stars = "★".repeat(Math.round(avg));
  const label = count === 1 ? "review" : "reviews";

  return `
    <div class="flex items-center gap-2 text-sm">
      <span style="color:#f59e0b">${stars}</span>
      <span class="font-medium">${formatRating(avg)}</span>
      <span class="text-slate-500">(${count} ${label})</span>
      ${
        verified
          ? `<span class="ml-2 text-emerald-600 text-xs">✔ Geverifieerd</span>`
          : ""
      }
    </div>
  `;
}

/* =========================
   DETAILS
========================= */
function renderDetails(c) {
  const list = document.getElementById("companyDetails");
  if (!list) return;

  list.innerHTML = "";

  addDetail(list, "Plaats", c.city);
  addDetail(
    list,
    "Categorie",
    Array.isArray(c.categories) ? c.categories.join(", ") : ""
  );
  addDetail(list, "Telefoon", c.phone);
  addDetail(list, "Website", c.website, true);
  addDetail(list, "Geverifieerd", c.isVerified ? "Ja" : "Nee");
}

function addDetail(list, label, value, isLink = false) {
  if (!value) return;

  const li = document.createElement("li");
  li.innerHTML = isLink
    ? `<strong>${label}:</strong> <a href="${value}" target="_blank" rel="noopener" class="text-indigo-600">${value}</a>`
    : `<strong>${label}:</strong> ${escapeHtml(String(value))}`;

  list.appendChild(li);
}

/* =========================
   REVIEWS
========================= */
async function loadReviews(companyId) {
  if (!companyId) return;

  try {
    const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
    if (!res.ok) return;

    const data = await res.json();
    const reviews = Array.isArray(data?.items) ? data.items : [];

    const container = document.getElementById("reviewsContainer");
    const empty = document.getElementById("noReviews");

    if (!container) return;

    container.innerHTML = "";

    if (!reviews.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");

    reviews.forEach((r) => {
      const div = document.createElement("div");
      div.className = "border-b border-slate-100 pb-3";

      div.innerHTML = `
        <div class="flex items-center gap-2 text-sm mb-1">
          <span style="color:#f59e0b">${"★".repeat(
            Math.round(r.rating || 0)
          )}</span>
          <span class="text-slate-500">${formatRating(r.rating)}</span>
        </div>
        <div class="text-sm text-slate-700">${escapeHtml(
          r.comment || ""
        )}</div>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error("❌ Reviews load error:", err);
  }
}

/* =========================
   HELPERS
========================= */
function formatRating(n) {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
