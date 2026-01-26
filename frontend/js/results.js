// frontend/js/results.js
// Resultatenpagina – 3 modes:
// 1) request-mode: ?requestId=...
// 2) offer-from-company: ?companySlug=...
// 3) search-mode: ?category=...&city=...&specialty=...

const API_BASE = "https://irisje-backend.onrender.com/api";

/* =========================
   Helpers
   ========================= */
function normalize(v) {
  return String(v || "").trim().toLowerCase();
}
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

function renderReviewBlock(company) {
  const googleRating = toNumberOrNull(company.avgRating ?? company.googleRating);
  const googleCount = toIntOrZero(company.reviewCount ?? company.googleReviewCount);

  let html = `<div class="company-reviews mt-1 flex flex-col gap-0.5 text-sm">`;

  if (googleRating && googleRating > 0) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Google</span>
        <span class="text-yellow-500">${renderStars(googleRating)}</span>
        <span class="text-gray-400 text-xs">(${googleCount})</span>
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

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const subtitleEl = document.getElementById("resultsSubtitle");

  if (!stateEl || !listEl) return;

  const isRequestMode = !!requestId;
  const isOfferFromCompanyMode = !!companySlug;
  const isSearchMode = !requestId && !companySlug && !!category && !!city;

  if (!isRequestMode && !isOfferFromCompanyMode && !isSearchMode) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  try {
    stateEl.textContent = "Resultaten laden…";

    /* =========================
       MODE 2 – offer-from-company
       ========================= */
    if (isOfferFromCompanyMode) {
      const anchorRes = await fetch(
        `${API_BASE}/companies/slug/${encodeURIComponent(companySlug)}`,
        { cache: "no-store" }
      );
      const anchorData = await anchorRes.json();
      if (!anchorRes.ok || !anchorData?.ok || !anchorData.company) {
        throw new Error("Ankerbedrijf kon niet worden geladen");
      }

      const anchor = anchorData.company;

      const simRes = await fetch(
        `${API_BASE}/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`,
        { cache: "no-store" }
      );
      const simData = await simRes.json();
      if (!simRes.ok || !simData?.ok) {
        throw new Error("Vergelijkbare bedrijven konden niet worden geladen");
      }

      const companies = [anchor, ...(simData.companies || [])];

      stateEl.textContent = "";
      if (subtitleEl) {
        subtitleEl.textContent = `Gebaseerd op jouw aanvraag bij ${anchor.name}.`;
      }
      renderCompanies(companies, anchor._id);
      if (footerEl) footerEl.classList.remove("hidden");
      return;
    }

    /* =========================
       MODE 1 – request-mode
       ========================= */
    if (isRequestMode) {
      const res = await fetch(
        `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error("Request kon niet worden geladen");
      }

      const companies = data.companies || [];
      if (!companies.length) {
        stateEl.textContent = "Er zijn op dit moment geen bedrijven beschikbaar.";
        return;
      }

      stateEl.textContent = "";
      renderCompanies(companies, data.request?.companyId || null);
      if (footerEl) footerEl.classList.remove("hidden");
      return;
    }

    /* =========================
       MODE 3 – search-mode
       ========================= */
    if (isSearchMode) {
      const res = await fetch(`${API_BASE}/companies`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.ok || !Array.isArray(data.companies)) {
        throw new Error("Bedrijven konden niet worden geladen");
      }

      const wantedCategory = normalize(category);
      const wantedCity = normalize(city);
      const wantedSpecialty = normalize(specialty);

      const filtered = data.companies.filter((c) => {
        const cCity = normalize(c.city);
        const cCategories = (c.categories || []).map(normalize);
        const cSpecialties = (c.specialties || []).map(normalize);

        const cityOk = wantedCity ? cCity === wantedCity : true;
        const catOk = wantedCategory ? cCategories.includes(wantedCategory) : true;
        const specOk = wantedSpecialty
          ? cSpecialties.includes(wantedSpecialty)
          : true;

        return cityOk && catOk && specOk;
      });

      if (!filtered.length) {
        stateEl.textContent = "Er zijn op dit moment geen bedrijven beschikbaar.";
        return;
      }

      stateEl.textContent = "";
      if (subtitleEl) {
        subtitleEl.textContent = `Gebaseerd op jouw zoekopdracht: ${category} in ${city}.`;
      }
      renderCompanies(filtered, null);
      if (footerEl) footerEl.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies, anchorId) {
    listEl.innerHTML = "";

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const isAnchor = anchorId && String(company._id) === String(anchorId);
      const profileUrl = `/company.html?slug=${encodeURIComponent(
        company.slug || ""
      )}&embed=1`;

      card.innerHTML = `
        <div class="company-info">
          <h3 class="company-name">
            ${isAnchor || index === 0 ? `<span class="best-match-badge">Beste match</span>` : ""}
            <a href="${profileUrl}" class="company-profile-link">
              ${escapeHtml(company.name)}
            </a>
          </h3>
          ${renderReviewBlock(company)}
          <div class="company-city">${escapeHtml(company.city)}</div>
        </div>
      `;
      listEl.appendChild(card);
    });
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
