// frontend/js/results.js
// Resultatenpagina – premium cards + selectie + teller + doorsturen (Optie A)
// + Duidelijke bronlabels voor reviews (Google / Irisje) als data aanwezig is.

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const countEl = document.getElementById("selectedCount");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const footerEl = document.getElementById("resultsFooter");

  if (!stateEl || !listEl) {
    console.error("results.js: verplichte elementen ontbreken");
    return;
  }

  if (!requestId) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const request = data.request || {};

    if (subtitleEl) {
      subtitleEl.textContent =
        `Gebaseerd op jouw aanvraag voor ${request.sector || ""} in ${request.city || ""}.`;
    }

    if (!companies.length) {
      stateEl.textContent =
        "Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.";
      return;
    }

    stateEl.textContent = "";

    if (footerEl) footerEl.classList.remove("hidden");

    renderCompanies(companies);
    updateSelectionUI();
  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const companyId = company?._id ? String(company._id) : "";

      const badge =
        index < 5 ? `<span class="top-match-badge">Beste match</span>` : "";

      const reviewsHtml = buildReviewsHtml(company);

      card.innerHTML = `
        <label class="company-select">
          <input
            type="checkbox"
            class="company-checkbox"
            data-company-id="${escapeHtml(companyId)}"
          />

          <div class="company-card-inner">
            <div class="company-header">
              <div class="company-title">
                <h3 class="company-name">${escapeHtml(company?.name)}</h3>
                <div class="company-city muted">${escapeHtml(company?.city)}</div>
              </div>
              <div class="company-badge">
                ${badge}
              </div>
            </div>

            <div class="company-meta">
              ${reviewsHtml}
            </div>
          </div>
        </label>
      `;

      const checkbox = card.querySelector(".company-checkbox");

      checkbox.addEventListener("change", () => {
        const checked = document.querySelectorAll(".company-checkbox:checked");
        if (checked.length > 5) {
          checkbox.checked = false;
          return;
        }
        updateSelectionUI();
      });

      listEl.appendChild(card);
    });
  }

  function buildReviewsHtml(company) {
    // Doel: toon Google + Irisje als die velden bestaan.
    // Geen aannames: we tonen alleen wat we daadwerkelijk in company aantreffen.

    const google = pickRating(company, [
      ["googleAvgRating", "googleReviewCount"],
      ["googleRating", "googleReviews"],
      ["googleRating", "googleReviewCount"],
      ["googleAvgRating", "googleReviews"]
    ]);

    const irisje = pickRating(company, [
      ["irisjeAvgRating", "irisjeReviewCount"],
      ["platformAvgRating", "platformReviewCount"],
      ["irisjeRating", "irisjeReviews"]
    ]);

    // Backwards compatibility / huidige situatie:
    // Als er maar één set bestaat via avgRating/reviewCount, tonen we die als "Irisje reviews"
    // (want dat zijn platformvelden in je Company-model), tenzij Google al expliciet aanwezig is.
    let legacy = null;
    if (!google && !irisje) {
      legacy = pickRating(company, [["avgRating", "reviewCount"]]);
    }

    const blocks = [];

    if (google) {
      blocks.push(renderRatingBlock("Google reviews", google.rating, google.count));
    }

    if (irisje) {
      blocks.push(renderRatingBlock("Irisje reviews", irisje.rating, irisje.count));
    }

    if (legacy) {
      blocks.push(renderRatingBlock("Irisje reviews", legacy.rating, legacy.count));
    }

    if (!blocks.length) return "";

    return `<div class="reviews-stack">${blocks.join("")}</div>`;
  }

  function pickRating(obj, candidates) {
    for (const [ratingKey, countKey] of candidates) {
      const ratingRaw = obj?.[ratingKey];
      const countRaw = obj?.[countKey];

      const rating = typeof ratingRaw === "number" ? ratingRaw : Number(ratingRaw);
      const count = typeof countRaw === "number" ? countRaw : Number(countRaw);

      const ratingOk = Number.isFinite(rating) && rating > 0;
      const countOk = Number.isFinite(count) && count > 0;

      if (ratingOk && countOk) {
        return { rating, count };
      }
    }
    return null;
  }

  function renderRatingBlock(label, rating, count) {
    // Compact, label duidelijk; gebruikt bestaande styling (muted) waar mogelijk.
    const r = Number(rating);
    const c = Number(count);
    const ratingText = Number.isFinite(r) ? r.toFixed(1) : "";
    const countText = Number.isFinite(c) ? String(c) : "";

    return `
      <div class="company-rating">
        <span class="muted">${escapeHtml(label)}:</span>
        <span class="stars">⭐ ${escapeHtml(ratingText)}</span>
        <span class="muted">(${escapeHtml(countText)})</span>
      </div>
    `;
  }

  function updateSelectionUI() {
    const selected = document.querySelectorAll(".company-checkbox:checked").length;
    if (countEl) countEl.textContent = `${selected} van 5 geselecteerd`;
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

// === LEIDENDE SUBMITKNOP ===
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#stickySubmitBtn");
  if (!btn) return;

  const selected = Array.from(
    document.querySelectorAll(".company-checkbox:checked")
  )
    .map((cb) => cb.dataset.companyId)
    .filter(Boolean);

  if (!selected.length) {
    alert("Selecteer minimaal één bedrijf.");
    return;
  }

  sessionStorage.setItem("selectedCompanyIds", JSON.stringify(selected));
  window.location.href = "/request-send.html";
});
