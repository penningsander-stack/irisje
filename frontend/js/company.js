// frontend/js/company.js
// v20260104-COMPANY-ID+SLUG-NO-REGRESSIONS
//
// - Ondersteunt:
//   - /company.html?company=ID  -> GET /api/publicCompanies/:id
//   - /company.html?slug=...    -> GET /api/companies/slug/:slug (bestaand)
// - Behoudt bestaande UI/IDs in company.html (Over/Reviews/Bedrijfsgegevens/Logo)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompany();
});

async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("company");
  const slug = params.get("slug");

  if (!companyId && !slug) {
    console.error("❌ company of slug ontbreekt in URL");
    return;
  }

  try {
    let c;

    if (companyId) {
      // Nieuw: bedrijf ophalen op ID via publicCompanies
      const res = await fetch(
        `${API_BASE}/publicCompanies/${encodeURIComponent(companyId)}`
      );

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`HTTP ${res.status} (geen JSON)`);
      }

      if (!res.ok || !data || !data.ok || !data.company) {
        throw new Error((data && data.error) ? data.error : "Not Found");
      }

      c = data.company;
    } else {
      // Bestaand: bedrijf ophalen op slug
      const res = await fetch(
        `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`
      );

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`HTTP ${res.status} (geen JSON)`);
      }

      if (!res.ok || !data || !data.company) {
        throw new Error((data && data.error) ? data.error : "Not Found");
      }

      c = data.company;
    }

    // ---------- DOM refs (matcht company.html) ----------
    const hero = document.getElementById("companyHero");
    const badge = document.getElementById("premiumBadge");
    const logoWrap = document.getElementById("companyLogoWrap");
    const logoEl = document.getElementById("companyLogo");
    const logoFallback = document.getElementById("companyLogoFallback");

    const nameEl = document.getElementById("companyName");
    const metaEl = document.getElementById("companyMeta");
    const ratingEl = document.getElementById("companyRating");

    const aboutEl = document.getElementById("companyAbout");
    const detailsEl = document.getElementById("companyDetails");

    const reviewSort = document.getElementById("reviewSort");
    const reviewsContainer = document.getElementById("reviewsContainer");
    const noReviews = document.getElementById("noReviews");

    // CTA’s (bestaand)
    const ctaRequest = document.getElementById("ctaRequest");
    const writeReviewBtn = document.getElementById("writeReviewBtn");

    // ---------- Header / hero ----------
    if (nameEl) nameEl.textContent = c.name || "Bedrijf";
    if (metaEl) metaEl.innerHTML = renderMeta(c);
    if (ratingEl) ratingEl.innerHTML = renderRating(c);

    // Premium badge (als je dit gebruikt in je model)
    if (badge) {
      if (c.isPremium) badge.classList.remove("hidden");
      else badge.classList.add("hidden");
    }

    // ---------- Logo (robust) ----------
    // Prioriteit:
    // 1) c.logoUrl / c.logo
    // 2) favicon op basis van website
    // 3) fallback (initialen)
    let logoUrl = c.logoUrl || c.logo || null;

    if (!logoUrl && c.website) {
      try {
        const domain = new URL(c.website).hostname;
        logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
        logoUrl = null;
      }
    }

    if (!logoUrl) {
      // Geen logo -> laat wrapper staan (layout), maar toon fallback
      if (logoWrap) logoWrap.classList.remove("hidden");
      if (logoEl) logoEl.classList.add("hidden");
      if (logoFallback) {
        logoFallback.textContent = getInitials(c.name || "");
        logoFallback.classList.remove("hidden");
      }
    } else {
      if (logoWrap) logoWrap.classList.remove("hidden");
      if (logoFallback) logoFallback.classList.add("hidden");

      if (logoEl) {
        logoEl.classList.add("hidden");
        logoEl.src = logoUrl;

        logoEl.onload = () => logoEl.classList.remove("hidden");
        logoEl.onerror = () => {
          // Als favicon faalt: fallback initialen
          logoEl.classList.add("hidden");
          if (logoFallback) {
            logoFallback.textContent = getInitials(c.name || "");
            logoFallback.classList.remove("hidden");
          }
        };
      }
    }

    // ---------- Over dit bedrijf ----------
    if (aboutEl) {
      aboutEl.innerHTML = `
        <div class="space-y-3">
          ${c.tagline ? `<p class="text-slate-700">${escapeHtml(c.tagline)}</p>` : ""}
          ${c.description ? `<p class="text-slate-700 leading-relaxed">${escapeHtml(c.description)}</p>` : `<p class="text-slate-500">Geen beschrijving beschikbaar.</p>`}
          ${renderChips("Categorieën", c.categories)}
          ${renderChips("Specialismes", c.specialties)}
          ${renderChips("Regio's", c.regions)}
        </div>
      `;
    }

    // ---------- Bedrijfsgegevens ----------
    if (detailsEl) {
      detailsEl.innerHTML = renderDetails(c);
    }

    // ---------- Reviews ----------
    if (reviewSort) {
      reviewSort.addEventListener("change", async () => {
        await loadReviews(c, reviewSort.value, reviewsContainer, noReviews);
      });
    }
    await loadReviews(c, (reviewSort && reviewSort.value) ? reviewSort.value : "newest", reviewsContainer, noReviews);

    // ---------- CTA’s ----------
    if (ctaRequest) {
      ctaRequest.addEventListener("click", () => {
        // Als je een aanvraagflow hebt: zet hier je bestaande redirect/logica
        // We laten dit bewust neutraal om niks te breken.
        window.location.href = "/index.html";
      });
    }

    if (writeReviewBtn) {
      writeReviewBtn.addEventListener("click", () => {
        // Als je al een reviewflow hebt, koppel hierop. Neutraal laten.
        window.location.href = "/index.html";
      });
    }

    if (hero) hero.classList.remove("opacity-50");
  } catch (err) {
    console.error("❌ Company load error:", err);
  }
}

async function loadReviews(company, sort, container, noReviewsEl) {
  if (!container) return;

  try {
    // Probeer eerst jouw bestaande reviews endpoint (als die bestaat).
    // In jouw eerdere codebase werd “nieuw reviews-endpoint” genoemd.
    // We houden dit defensief zodat het geen 404-crash wordt.
    const candidates = [
      `${API_BASE}/reviews/public?companyId=${encodeURIComponent(company._id)}&sort=${encodeURIComponent(sort)}`,
      `${API_BASE}/reviews?companyId=${encodeURIComponent(company._id)}&sort=${encodeURIComponent(sort)}`,
    ];

    let data = null;

    for (const url of candidates) {
      const res = await fetch(url);
      if (!res.ok) continue;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (data && (data.ok === true || Array.isArray(data.reviews) || Array.isArray(data.items))) {
        break;
      }
    }

    const reviews = (data && (data.reviews || data.items)) ? (data.reviews || data.items) : [];

    container.innerHTML = "";
    if (!reviews.length) {
      if (noReviewsEl) noReviewsEl.classList.remove("hidden");
      return;
    }
    if (noReviewsEl) noReviewsEl.classList.add("hidden");

    container.innerHTML = reviews
      .map(r => renderReviewCard(r))
      .join("");
  } catch (err) {
    console.warn("⚠ reviews load failed:", err);
    // Geen reviews tonen zonder de pagina “kapot” te maken
    container.innerHTML = "";
    if (noReviewsEl) noReviewsEl.classList.remove("hidden");
  }
}

function renderMeta(c) {
  const parts = [];
  if (c.city) parts.push(escapeHtml(c.city));
  if (Array.isArray(c.categories) && c.categories.length) parts.push(escapeHtml(c.categories[0]));
  if (c.website) parts.push(`<a class="underline text-slate-700" href="${escapeAttr(c.website)}" target="_blank" rel="noopener">Website</a>`);
  return `<div class="text-sm text-slate-600 flex flex-wrap gap-x-3 gap-y-1">${parts.map(p => `<span>${p}</span>`).join("")}</div>`;
}

function renderRating(c) {
  const avg = typeof c.avgRating === "number" ? c.avgRating : null;
  const count = typeof c.reviewCount === "number" ? c.reviewCount : null;
  const verified = !!(c.isVerified || c.verified);

  if (avg == null || count == null) return "";

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

function renderDetails(c) {
  const rows = [];

  if (c.city) rows.push(row("Plaats", escapeHtml(c.city)));
  if (c.phone) rows.push(row("Telefoon", `<a class="underline" href="tel:${escapeAttr(c.phone)}">${escapeHtml(c.phone)}</a>`));
  if (c.email) rows.push(row("E-mail", `<a class="underline" href="mailto:${escapeAttr(c.email)}">${escapeHtml(c.email)}</a>`));
  if (c.website) rows.push(row("Website", `<a class="underline" href="${escapeAttr(c.website)}" target="_blank" rel="noopener">${escapeHtml(c.website)}</a>`));

  if (!rows.length) {
    return `<p class="text-slate-500">Geen bedrijfsgegevens beschikbaar.</p>`;
  }

  return `
    <div class="space-y-2">
      ${rows.join("")}
    </div>
  `;
}

function row(label, valueHtml) {
  return `
    <div class="flex items-start justify-between gap-4 border-b border-slate-100 pb-2">
      <div class="text-sm text-slate-500">${label}</div>
      <div class="text-sm text-slate-800 text-right">${valueHtml}</div>
    </div>
  `;
}

function renderChips(title, arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  const chips = arr
    .slice(0, 12)
    .map(v => `<span class="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">${escapeHtml(v)}</span>`)
    .join(" ");
  return `
    <div class="pt-2">
      <div class="text-xs text-slate-500 mb-2">${escapeHtml(title)}</div>
      <div class="flex flex-wrap gap-2">${chips}</div>
    </div>
  `;
}

function renderReviewCard(r) {
  const name = r.name || r.authorName || "Anoniem";
  const rating = typeof r.rating === "number" ? r.rating : null;
  const text = r.text || r.message || "";
  const date = r.createdAt || r.date || "";

  const stars = rating != null ? "★".repeat(Math.max(1, Math.min(5, Math.round(rating)))) : "";

  return `
    <div class="border border-slate-200 rounded-2xl p-4 bg-white shadow-soft">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="font-medium text-slate-900">${escapeHtml(name)}</div>
        <div class="text-sm" style="color:#f59e0b">${stars}</div>
      </div>
      ${date ? `<div class="text-xs text-slate-500 mb-2">${escapeHtml(formatDate(date))}</div>` : ""}
      ${text ? `<div class="text-sm text-slate-700 leading-relaxed">${escapeHtml(text)}</div>` : `<div class="text-sm text-slate-500">Geen tekst.</div>`}
    </div>
  `;
}

function formatRating(v) {
  try {
    return Number(v).toFixed(1);
  } catch {
    return "";
  }
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString("nl-NL", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "";
  }
}

function getInitials(name) {
  const s = (name || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0] ? parts[0][0] : "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : (parts[0][1] || "");
  return (a + b).toUpperCase();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;");
}
