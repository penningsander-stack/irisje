// frontend/js/results.js
// Resultatenpagina – request-mode + company-mode
// Volledig gesynchroniseerd met frontend/results.html

/* =========================
   ⭐ Google-style sterren
   ========================= */

function renderStars(rating) {
  if (typeof rating !== "number" || rating <= 0) return "";

  const rounded = Math.round(rating * 2) / 2;
  let html = `<span class="rating-number mr-1">${rounded
    .toString()
    .replace(".", ",")}</span><span class="star-rating">`;

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

function renderReviewBlock(company) {
  let html = `<div class="company-reviews mt-1 text-sm">`;

  if (typeof company.avgRating === "number" && company.avgRating > 0) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Google</span>
        <span class="text-yellow-500">${renderStars(company.avgRating)}</span>
      </div>
    `;
  }

  if (
    typeof company.averageRating === "number" &&
    Number.isInteger(company.reviewCount) &&
    company.reviewCount > 0
  ) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Irisje</span>
        <span class="text-yellow-500">${renderStars(
          company.averageRating
        )}</span>
        <span class="text-gray-400 text-xs">(${company.reviewCount})</span>
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
  const category = params.get("category");
  const specialty = params.get("specialty");
  const city = params.get("city");

  // ✔ Correct gekoppeld aan results.html
  const stateEl = document.getElementById("resultsInfo");
  const listEl = document.getElementById("companiesGrid");
  const errorEl = document.getElementById("resultsError");
  const titleEl = document.getElementById("resultsTitle");

  if (!stateEl || !listEl || !titleEl) return;

  const isRequestMode = !!requestId;
  const isCompanyMode = !requestId && category && specialty && city;

  if (!isRequestMode && !isCompanyMode) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  // ✔ Contexttekst
  if (isRequestMode) {
    titleEl.textContent = "Geschikte bedrijven voor jouw aanvraag";
    stateEl.textContent = "Vergelijk en kies zelf met wie je verdergaat.";
  } else {
    titleEl.textContent = "Vergelijkbare bedrijven";
    stateEl.textContent =
      "Deze bedrijven sluiten aan op jouw gekozen dienstverlener.";
  }

  /* =========================
     Data ophalen
     ========================= */

  try {
    let fetchUrl;

    if (isRequestMode) {
      fetchUrl = `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`;
    } else {
      fetchUrl = `https://irisje-backend.onrender.com/api/companies/match?category=${encodeURIComponent(
        category
      )}&specialty=${encodeURIComponent(
        specialty
      )}&city=${encodeURIComponent(city)}`;
    }

    const res = await fetch(fetchUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];

    if (!companies.length) {
      stateEl.textContent =
        "Er zijn op dit moment geen bedrijven beschikbaar.";
      return;
    }

    renderCompanies(companies);
  } catch (err) {
    console.error(err);
    if (errorEl) {
      errorEl.textContent = "Resultaten konden niet worden geladen.";
      errorEl.classList.remove("hidden");
    }
  }

  /* =========================
     Render bedrijven
     ========================= */

  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className =
        "result-card bg-white border rounded-lg p-4 shadow-sm";

      const profileUrl = `/company.html?slug=${encodeURIComponent(
        company.slug || ""
      )}&embed=1`;

      card.innerHTML = `
        <div class="flex flex-col gap-2">
          <h3 class="font-semibold text-lg">
            ${
              index === 0
                ? `<span class="best-match-badge mr-2">Beste match</span>`
                : ""
            }
            <a href="${profileUrl}" class="company-profile-link">
              ${escapeHtml(company.name)}
            </a>
          </h3>
          ${renderReviewBlock(company)}
          <div class="text-sm text-gray-600">
            ${escapeHtml(company.city || "")}
          </div>
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
      "'": "&#39;"
    })[s]);
  }
});
