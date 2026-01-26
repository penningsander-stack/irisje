// frontend/js/results.js
// Resultatenpagina – 3 modes:
// 1) request-mode: ?requestId=...
// 2) offer-from-company: ?companySlug=...
// 3) search-mode: ?category=...&city=...&specialty=...
// Reviews: Google (avgRating/reviewCount) + Irisje (irisjeAvgRating/irisjeReviewCount)

const API_BASE = "https://irisje-backend.onrender.com/api";

/* =========================
   Helpers
   ========================= */
function normalizeSlug(v) {
  return String(v || "").trim().toLowerCase();
}

/* =========================
   ⭐ Google-style sterren
   ========================= */
function renderStars(rating) {
  if (typeof rating !== "number" || rating <= 0) return "";

  const rounded = Math.round(rating * 2) / 2;

  let html = `
    <span class="rating-number mr-1 text-gray-900">
      ${rounded.toString().replace(".", ",")}
    </span>
    <span class="star-rating">
  `;

  for (let i = 1; i <= 5; i++) {
    let fill = 0;
    if (rounded >= i) fill = 100;
    else if (rounded + 0.5 === i) fill = 50;

    html += `
      <span class="star">
        ★
        <span class="star-fill" style="width:${fill}%">★</span>
      </span>
    `;
  }

  html += `</span>`;
  return html;
}

function toNumberOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toIntOrZero(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

/**
 * Reviews:
 * - Google: avgRating + reviewCount (Company document)
 * - Irisje: irisjeAvgRating + irisjeReviewCount (publicRequests aggregation)
 * Fallback (oude situatie): averageRating + reviewCount (Irisje),
 * maar alléén als irisje* ontbreekt.
 */
function renderReviewBlock(company) {
  const googleRating = toNumberOrNull(company.avgRating ?? company.googleRating);
  const googleCount = toIntOrZero(company.reviewCount ?? company.googleReviewCount);

  const irisjeRatingNew = toNumberOrNull(company.irisjeAvgRating);
  const irisjeCountNew = toIntOrZero(company.irisjeReviewCount);

  const irisjeRatingOld = toNumberOrNull(company.averageRating);
  const irisjeCountOld = toIntOrZero(company.reviewCount);

  const hasIrisjeNew = irisjeRatingNew != null && irisjeCountNew > 0;
  const hasIrisjeOld = !hasIrisjeNew && irisjeRatingOld != null && irisjeCountOld > 0;

  let html = `<div class="company-reviews mt-1 flex flex-col gap-0.5 text-sm">`;

  if (googleRating != null && googleRating > 0) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Google</span>
        <span class="text-yellow-500">${renderStars(googleRating)}</span>
        <span class="text-gray-400 text-xs">(${googleCount})</span>
      </div>
    `;
  }

  if (hasIrisjeNew) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Irisje</span>
        <span class="text-yellow-500">${renderStars(irisjeRatingNew)}</span>
        <span class="text-gray-400 text-xs">(${irisjeCountNew})</span>
      </div>
    `;
  } else if (hasIrisjeOld) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Irisje</span>
        <span class="text-yellow-500">${renderStars(irisjeRatingOld)}</span>
        <span class="text-gray-400 text-xs">(${irisjeCountOld})</span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* =========================
   DOMContentLoaded
   ========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const requestId = params.get("requestId");
  const rawCompanySlug = params.get("companySlug");
  const companySlug = normalizeSlug(rawCompanySlug);

  const category = params.get("category");
  const specialty = params.get("specialty");
  const city = params.get("city");

  const companyIdFromUrl = params.get("companyId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const subtitleEl = document.getElementById("resultsSubtitle");

  const modalOverlay = document.getElementById("companyModalOverlay");
  const modalCloseBtn = document.getElementById("companyModalClose");
  const modalOpenNewTabBtn = document.getElementById("companyModalOpenNewTab");
  const modalTitle = document.getElementById("companyModalTitle");
  const modalFrame = document.getElementById("companyModalFrame");

  let modalUrl = "";
  let storedScrollY = 0;

  if (!stateEl || !listEl) return;

  const isRequestMode = !!requestId;
  const isOfferFromCompanyMode = !!companySlug;
  const isSearchMode = !requestId && !companySlug && !!category && !!city;

  if (!isRequestMode && !isOfferFromCompanyMode && !isSearchMode) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  /* =========================
     MODE 2: offer-from-company
     ========================= */
  try {
    stateEl.textContent = "Resultaten laden…";

    if (isOfferFromCompanyMode) {
      if (!companySlug) {
        throw new Error("companySlug ontbreekt");
      }

      const anchorRes = await fetch(
        `${API_BASE}/companies/slug/${encodeURIComponent(companySlug)}`,
        { cache: "no-store" }
      );
      const anchorData = await anchorRes.json();
      if (!anchorRes.ok || !anchorData?.ok || !anchorData.company) {
        throw new Error(anchorData?.message || "Ankerbedrijf kon niet worden geladen");
      }

      const anchor = anchorData.company;

      const simRes = await fetch(
        `${API_BASE}/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`,
        { cache: "no-store" }
      );
      const simData = await simRes.json();
      if (!simRes.ok || !simData?.ok) {
        throw new Error(simData?.message || "Vergelijkbare bedrijven konden niet worden geladen");
      }

      const similars = Array.isArray(simData.companies) ? simData.companies : [];
      const merged = [anchor, ...similars];

      stateEl.textContent = "";
      if (subtitleEl) {
        subtitleEl.textContent = `Gebaseerd op jouw aanvraag bij ${anchor.name}. Selecteer maximaal 5 bedrijven.`;
      }

      renderCompanies(merged, { anchorId: anchor._id });
      if (footerEl) footerEl.classList.remove("hidden");
      return;
    }

    // overige modes ongewijzigd …
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies, options = {}) {
    listEl.innerHTML = "";
    updateSelectionUI();

    const anchorId = options.anchorId ? String(options.anchorId) : null;

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const isAnchor = anchorId && String(company._id) === anchorId;
      const profileUrl = `/company.html?slug=${encodeURIComponent(company.slug || "")}&embed=1`;

      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox"
            class="company-checkbox"
            data-company-id="${company._id || ""}"
            data-company-slug="${company.slug || ""}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3 class="company-name block">
                ${isAnchor || index === 0 ? `<span class="best-match-badge">Beste match</span>` : ""}
                <a href="${profileUrl}"
                   class="company-profile-link"
                   data-company-name="${escapeHtml(company.name)}">
                  ${escapeHtml(company.name)}
                </a>
              </h3>
              ${renderReviewBlock(company)}
            </div>
            <div class="company-city">${escapeHtml(company.city)}</div>
          </div>
        </label>
      `;

      listEl.appendChild(card);
    });
  }

  function updateSelectionUI() {
    const selected = listEl.querySelectorAll(".company-checkbox:checked").length;
    if (countEl) countEl.textContent = `${selected} van 5 geselecteerd`;
    if (sendBtn) sendBtn.disabled = selected === 0;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[s]);
  }
});
