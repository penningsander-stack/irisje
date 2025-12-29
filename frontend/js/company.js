// frontend/js/company.js
// v20251229-COMPANY-NO-PLACEHOLDERS
//
// - Slug-based load
// - Toont ALLEEN echte logo-URL
// - Geen placeholders / geen initialen
// - Gele sterren (#f59e0b)
// - Reviews via company _id

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompany);

/* =========================
   INIT
========================= */
async function initCompany() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (!slug) {
    console.error("❌ slug ontbreekt");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const company = data?.item || data;
    if (!company) throw new Error("Geen company data");

    renderHero(company);
    renderAbout(company);
    renderDetails(company);
    loadReviews(company._id);
  } catch (e) {
    console.error("❌ Company load error:", e);
  }
}

/* =========================
   HERO
========================= */
function renderHero(c) {
  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const ratingEl = document.getElementById("companyRating");
  const badgeEl = document.getElementById("premiumBadge");

  const logoWrap = document.getElementById("companyLogoWrap");
  const logoEl = document.getElementById("companyLogo");

  if (nameEl) nameEl.textContent = c.name || "Onbekend bedrijf";

  if (metaEl) {
    const cat = Array.isArray(c.categories) ? c.categories[0] : "";
    metaEl.textContent = [c.city, cat].filter(Boolean).join(" · ");
  }

  // ⭐ rating
  if (ratingEl) {
    ratingEl.innerHTML = renderHeroRating(
      Number(c.avgRating) || 0,
      Number(c.reviewCount) || 0,
      Boolean(c.isVerified)
    );
  }

  // Premium badge
  if (badgeEl && (c.isPremium || c.premium)) {
    badgeEl.classList.remove("hidden");
  }

  // ✅ LOGO: alleen tonen als er een ECHTE URL is
  const logoUrl = getLogoUrl(c);

  if (logoUrl && logoEl && logoWrap) {
    logoEl.src = logoUrl;
    logoEl.classList.remove("hidden");
    logoWrap.classList.remove("hidden");

    // als logo-URL tóch faalt → hele blok weg, geen fallback
    logoEl.onerror = () => {
      logoEl.onerror = null;
      logoWrap.remove();
    };
  } else if (logoWrap) {
    // geen logo → hele logo-sectie weg
    logoWrap.remove();
  }
}

function getLogoUrl(c) {
  // accepteer meerdere mogelijke backend-velden, maar ALLEEN als ze bestaan
  const candidates = [
    c.logo,
    c.logoUrl,
    c.logoURL,
    c.image,
    c.imageUrl,
    c.imageURL,
    c.brandLogo,
  ];
  const found = candidates.find(v => typeof v === "string" && v.trim().length > 0);
  return found ? found.trim() : "";
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
      ${verified ? `<span class="ml-2 text-emerald-600 text-xs">✔ Geverifieerd</span>` : ""}
    </div>
  `;
}

/* =========================
   ABOUT
========================= */
function renderAbout(c) {
  const aboutEl = document.getElementById("companyAbout");
  if (!aboutEl) return;

  aboutEl.textContent =
    (c.description && String(c.description).trim())
      ? String(c.description).trim()
      : "Dit bedrijf heeft nog geen uitgebreide beschrijving toegevoegd.";
}

/* =========================
   DETAILS
========================= */
function renderDetails(c) {
  const list = document.getElementById("companyDetails");
  if (!list) return;

  list.innerHTML = "";

  addDetail(list, "Plaats", c.city);
  addDetail(list, "Categorie", Array.isArray(c.categories) ? c.categories.join(", ") : "");
  addDetail(list, "Telefoon", c.phone);
  addDetail(list, "Website", c.website, true);
  addDetail(list, "Geverifieerd", c.isVerified ? "Ja" : "Nee");
}

function addDetail(list, label, value, isLink = false) {
  if (!value) return;

  const li = document.createElement("li");
  li.innerHTML = isLink
    ? `<strong>${label}:</strong> <a href="${escapeAttr(value)}" target="_blank" rel="noopener" class="text-indigo-600">${escapeHtml(value)}</a>`
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
      empty?.classList.remove("hidden");
      return;
    }
    empty?.classList.add("hidden");

    reviews.forEach(r => {
      const div = document.createElement("div");
      div.className = "border-b border-slate-100 pb-3";
      div.innerHTML = `
        <div class="flex items-center gap-2 text-sm mb-1">
          <span style="color:#f59e0b">${"★".repeat(Math.round(r.rating || 0))}</span>
          <span class="text-slate-500">${formatRating(r.rating || 0)}</span>
        </div>
        <div class="text-sm text-slate-700">${escapeHtml(r.comment || "")}</div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error("❌ Reviews error:", e);
  }
}

/* =========================
   HELPERS
========================= */
function formatRating(n) {
  return (Math.round(Number(n) * 10) / 10).toString().replace(".", ",");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "%22");
}
