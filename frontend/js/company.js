// frontend/js/company.js
// v20251229-COMPANY-HERO-RATING-LOGO-FIX
//
// - Laadt bedrijf via slug
// - Toon logo als aanwezig (meerdere veldnamen)
// - Geen placeholder-image (dus geen 404)
// - Initials fallback als er geen logo is
// - Gele sterren (#f59e0b)
// - Reviews via company _id

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompany();
});

async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

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
  const badgeEl = document.getElementById("premiumBadge");

  if (nameEl) nameEl.textContent = c.name || "Onbekend bedrijf";

  if (metaEl) {
    const cat = Array.isArray(c.categories) && c.categories.length ? c.categories[0] : "";
    metaEl.textContent = [c.city, cat].filter(Boolean).join(" · ");
  }

  if (badgeEl && (c.isPremium || c.premium)) {
    badgeEl.classList.remove("hidden");
  }

  // ⭐ rating in hero
  if (ratingEl) {
    ratingEl.innerHTML = renderHeroRating(
      Number(c.avgRating) || 0,
      Number(c.reviewCount) || 0,
      Boolean(c.isVerified)
    );
  }

  // ✅ logo (zonder placeholder)
  applyCompanyLogo(c);
}

function applyCompanyLogo(c) {
  const logoEl = document.getElementById("companyLogo");
  const fallbackEl = document.getElementById("companyLogoFallback");
  const wrapEl = document.getElementById("companyLogoWrap");

  if (!wrapEl) return;

  const logoUrl = pickLogoUrl(c);

  // reset state
  if (logoEl) {
    logoEl.classList.add("hidden");
    logoEl.removeAttribute("src");
  }
  if (fallbackEl) {
    fallbackEl.classList.add("hidden");
    fallbackEl.textContent = "";
  }

  if (logoUrl && logoEl) {
    logoEl.src = logoUrl;
    logoEl.classList.remove("hidden");

    // als de url tóch stuk is: toon initials fallback i.p.v. 404-loop
    logoEl.onerror = () => {
      logoEl.onerror = null;
      logoEl.classList.add("hidden");
      logoEl.removeAttribute("src");
      showInitialsFallback(c, fallbackEl);
    };

    return;
  }

  // geen logo -> initials
  showInitialsFallback(c, fallbackEl);
}

function pickLogoUrl(c) {
  // accepteer meerdere mogelijke veldnamen (veilig)
  const candidates = [
    c.logo,
    c.logoUrl,
    c.logoURL,
    c.image,
    c.imageUrl,
    c.imageURL,
    c.brandLogo,
  ];

  const found = candidates.find((v) => typeof v === "string" && v.trim().length > 0);
  return found ? found.trim() : "";
}

function showInitialsFallback(c, fallbackEl) {
  if (!fallbackEl) return;

  const initials = makeInitials(c?.name || "");
  fallbackEl.textContent = initials || "I";
  fallbackEl.classList.remove("hidden");
}

function makeInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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

  const text = (c.description && String(c.description).trim())
    ? String(c.description).trim()
    : "Dit bedrijf heeft nog geen uitgebreide beschrijving toegevoegd.";

  aboutEl.textContent = text;
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
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");

    // sort
    const sortEl = document.getElementById("reviewSort");
    const sortMode = sortEl?.value || "newest";
    const sorted = sortReviews(reviews, sortMode);

    sorted.forEach((r) => {
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

    // bind sort change once
    if (sortEl && !sortEl.dataset.bound) {
      sortEl.dataset.bound = "1";
      sortEl.addEventListener("change", () => loadReviews(companyId));
    }
  } catch (err) {
    console.error("❌ Reviews load error:", err);
  }
}

function sortReviews(items, mode) {
  const arr = [...items];
  if (mode === "highest") {
    return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  // newest default (op createdAt)
  return arr.sort((a, b) => {
    const da = Date.parse(a.createdAt || "") || 0;
    const db = Date.parse(b.createdAt || "") || 0;
    return db - da;
  });
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
