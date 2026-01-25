// frontend/js/results.js
// MODE A: search (category + city + optional specialty)
// MODE B: offer-from-company (anchor company via SLUG + max 4 similar)

document.addEventListener("DOMContentLoaded", init);

const MAX_SELECT = 5;

async function init() {
  try {
    const params = new URLSearchParams(window.location.search);

    const companySlug = params.get("companySlug");
    const category = params.get("category");
    const city = params.get("city");
    const specialty = params.get("specialty"); // ✅ nieuw: optioneel

    setState("Laden…");

    if (companySlug) {
      await runOfferMode(companySlug);
    } else {
      await runSearchMode(category, city, specialty);
    }

    setState("");

    // Let op: alleen selection UI activeren als er echt kaarten/checkboxes staan.
    const checkboxCount = document.querySelectorAll(".company-checkbox").length;
    if (checkboxCount > 0) {
      enableSelectionLimit(MAX_SELECT);
      updateSelectionUI(MAX_SELECT);
    } else {
      hideFooter();
    }
  } catch (err) {
    console.error(err);
    showError("Er ging iets mis bij het laden van de resultaten.");
  }
}

/* ============================================================
   MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF (SLUG)
   ============================================================ */

async function runOfferMode(companySlug) {
  resetCompanies();

  // 1) haal ankerbedrijf op via SLUG
  const anchorRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies/slug/${encodeURIComponent(companySlug)}`
  );
  const anchorData = await safeJson(anchorRes);

  if (!anchorRes.ok || !anchorData?.ok || !anchorData?.company) {
    throw new Error(anchorData?.message || "Ankerbedrijf kon niet worden geladen");
  }

  const anchor = anchorData.company;

  // 2) render ankerbedrijf als eerste (Beste match)
  renderCompanies([anchor], { isAnchor: true });

  // 3) haal vergelijkbare bedrijven op
  const similarRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`
  );
  const similarData = await safeJson(similarRes);

  if (!similarRes.ok || !similarData?.ok) {
    throw new Error(similarData?.message || "Similar-endpoint faalde");
  }

  const similars = Array.isArray(similarData.companies)
    ? similarData.companies.slice(0, 4)
    : [];

  // 4) render vergelijkbare bedrijven
  renderCompanies(similars, { isAnchor: false });
}

/* ============================================================
   MODE A — ZOEKRESULTATEN
   ============================================================ */

async function runSearchMode(category, city, specialty) {
  resetCompanies();

  // Server-side filter (als backend dit ondersteunt)
  const url = new URL("https://irisje-backend.onrender.com/api/companies");
  if (category) url.searchParams.set("category", category);
  if (city) url.searchParams.set("city", city);
  if (specialty) url.searchParams.set("specialty", specialty); // ✅ veilig: backend mag negeren

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = await safeJson(res);

  if (!res.ok || !data?.ok || !Array.isArray(data.companies)) {
    throw new Error(data?.message || "Zoekresultaten konden niet worden geladen");
  }

  // Client-side specialty fallback (als backend niet filtert)
  let companies = data.companies;
  if (specialty) {
    const wanted = normalize(specialty);
    companies = companies.filter((c) => {
      const list = Array.isArray(c?.specialties) ? c.specialties : [];
      return list.map(normalize).includes(wanted);
    });
  }

  renderCompanies(companies, { isAnchor: false });
}

/* ============================================================
   RENDERING
   ============================================================ */

function resetCompanies() {
  const list = document.getElementById("companiesList");
  if (list) list.innerHTML = "";
  setState("");
  hideFooter();
}

function renderCompanies(companies, options = {}) {
  const container = document.getElementById("companiesList");
  if (!container) return;

  if (!Array.isArray(companies) || companies.length === 0) {
    setState("Geen geschikte bedrijven gevonden.");
    hideFooter();
    return;
  }

  companies.forEach((company) => {
    const card = document.createElement("div");

    card.className = "result-card";
    if (options.isAnchor) card.classList.add("best-match");

    const name = escapeHtml(company?.name || "Onbekend bedrijf");
    const city = escapeHtml(company?.city || "");
    const id = company?._id ? String(company._id) : "";

    const reviewHtml = buildReviewsHtml(company);

    card.innerHTML = `
      <div class="result-card-inner">
        ${options.isAnchor ? `<div class="badge">Beste match</div>` : ""}

        <div class="result-card-main">
          <h3 class="result-title">${name}</h3>

          ${reviewHtml ? `<div class="result-reviews">${reviewHtml}</div>` : ``}

          ${city ? `<p class="muted">${city}</p>` : ``}
        </div>

        <label class="result-select">
          <input type="checkbox" class="company-checkbox" value="${escapeHtml(id)}" />
          <span>Selecteer</span>
        </label>
      </div>
    `;

    container.appendChild(card);
  });

  showFooter();
}

/* ============================================================
   REVIEWS (Google + Irisje) — veilig/defensief
   ============================================================ */

function buildReviewsHtml(company) {
  // Irisje (jouw eigen reviews)
  const irisjeRating = toNumber(company?.avgRating);
  const irisjeCount = toInt(company?.reviewCount);

  // Google (alleen als deze velden bestaan in je data)
  const googleRating = toNumber(company?.googleRating);
  const googleCount = toInt(company?.googleReviewCount);

  const parts = [];

  if (isFinite(googleRating) && googleRating > 0 && googleCount >= 0) {
    parts.push(renderRatingRow("Google", googleRating, googleCount));
  }

  if (isFinite(irisjeRating) && irisjeRating > 0 && irisjeCount >= 0) {
    parts.push(renderRatingRow("Irisje", irisjeRating, irisjeCount));
  }

  // Als geen van beide beschikbaar is: niets tonen (oude gedrag: reviews weg)
  if (parts.length === 0) return "";

  return parts.join("");
}

function renderRatingRow(sourceLabel, rating, count) {
  const safeLabel = escapeHtml(sourceLabel);
  const safeRatingText = escapeHtml(formatRating(rating));
  const safeCountText = escapeHtml(String(count));

  return `
    <div class="rating-row">
      <span class="rating-source">${safeLabel}</span>
      <span class="rating-stars" aria-label="${safeLabel} rating ${safeRatingText}">
        ${renderStars(rating)}
      </span>
      <span class="rating-value">${safeRatingText}</span>
      <span class="rating-count">(${safeCountText})</span>
    </div>
  `;
}

function renderStars(rating) {
  // 5 sterren, met halve ster (Google-stijl)
  const r = clamp(toNumber(rating), 0, 5);
  const full = Math.floor(r);
  const half = r - full >= 0.25 && r - full < 0.75 ? 1 : (r - full >= 0.75 ? 0 : 0);
  const extraFull = r - full >= 0.75 ? 1 : 0;

  const fullStars = Math.min(5, full + extraFull);
  const halfStars = fullStars < 5 ? half : 0;
  const emptyStars = 5 - fullStars - halfStars;

  const starFull = svgStar("full");
  const starHalf = svgStar("half");
  const starEmpty = svgStar("empty");

  return (
    starFull.repeat(fullStars) +
    starHalf.repeat(halfStars) +
    starEmpty.repeat(emptyStars)
  );
}

function svgStar(type) {
  // Inline SVG, gebruikt currentColor (dus past in je bestaande CSS/kleuren)
  if (type === "full") {
    return `
      <svg class="star star-full" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 15.27l-5.18 3.05 1.4-5.98L1.5 8.63l6.08-.52L10 2.5l2.42 5.61 6.08.52-4.72 3.71 1.4 5.98z"></path>
      </svg>
    `;
  }
  if (type === "half") {
    return `
      <svg class="star star-half" viewBox="0 0 20 20" aria-hidden="true">
        <defs>
          <linearGradient id="halfGrad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stop-color="currentColor"></stop>
            <stop offset="50%" stop-color="transparent"></stop>
          </linearGradient>
        </defs>
        <path fill="url(#halfGrad)" d="M10 15.27l-5.18 3.05 1.4-5.98L1.5 8.63l6.08-.52L10 2.5l2.42 5.61 6.08.52-4.72 3.71 1.4 5.98z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1" d="M10 15.27l-5.18 3.05 1.4-5.98L1.5 8.63l6.08-.52L10 2.5l2.42 5.61 6.08.52-4.72 3.71 1.4 5.98z"></path>
      </svg>
    `;
  }
  // empty
  return `
    <svg class="star star-empty" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="none" stroke="currentColor" stroke-width="1" d="M10 15.27l-5.18 3.05 1.4-5.98L1.5 8.63l6.08-.52L10 2.5l2.42 5.61 6.08.52-4.72 3.71 1.4 5.98z"></path>
    </svg>
  `;
}

/* ============================================================
   SELECTIE + FOOTER UI
   ============================================================ */

function enableSelectionLimit(max) {
  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("company-checkbox")) return;

    const checked = document.querySelectorAll(".company-checkbox:checked");

    if (checked.length > max) {
      e.target.checked = false;
      alert(`Je kunt maximaal ${max} bedrijven selecteren.`);
    }

    updateSelectionUI(max);
  });
}

function updateSelectionUI(max) {
  const allCheckboxes = document.querySelectorAll(".company-checkbox");
  const checked = document.querySelectorAll(".company-checkbox:checked");

  // ✅ Fix: als er geen kaarten/checkboxes zijn, footer weg
  if (allCheckboxes.length === 0) {
    hideFooter();
    return;
  }

  const count = checked.length;

  const footer = document.getElementById("resultsFooter");
  const selectedCount = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");

  if (selectedCount) {
    selectedCount.textContent = `${count} van ${max} geselecteerd`;
  }

  if (footer) {
    footer.classList.remove("hidden");
  }

  if (sendBtn) {
    sendBtn.disabled = count === 0;
  }
}

function showFooter() {
  const footer = document.getElementById("resultsFooter");
  const hasCheckboxes = document.querySelectorAll(".company-checkbox").length > 0;

  if (!hasCheckboxes) {
    hideFooter();
    return;
  }

  if (footer) footer.classList.remove("hidden");
}

function hideFooter() {
  const footer = document.getElementById("resultsFooter");
  if (footer) footer.classList.add("hidden");

  const selectedCount = document.getElementById("selectedCount");
  if (selectedCount) selectedCount.textContent = `0 van ${MAX_SELECT} geselecteerd`;

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.disabled = true;
}

/* ============================================================
   STATE / FOUTMELDING
   ============================================================ */

function setState(message) {
  const state = document.getElementById("resultsState");
  if (!state) return;

  state.textContent = message || "";
}

function showError(message) {
  setState(message);

  const container = document.getElementById("companiesList");
  if (container) container.innerHTML = "";
  hideFooter();
}

/* ============================================================
   HELPERS
   ============================================================ */

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(v) {
  return String(v || "").toLowerCase().trim();
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function toInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatRating(r) {
  const n = clamp(toNumber(r), 0, 5);
  // NL-notatie (komma) zonder te breken als CSS/UX dit anders wil
  return n.toFixed(1).replace(".", ",");
}
