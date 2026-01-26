// frontend/js/results.js
// Resultatenpagina – 3 modes:
// 1) request-mode: ?requestId=...
// 2) offer-from-company: ?companySlug=...
// 3) search-mode: ?category=...&city=...&specialty=...
// Reviews: Google (avgRating/reviewCount) + Irisje (irisjeAvgRating/irisjeReviewCount)

const API_BASE = "https://irisje-backend.onrender.com/api";

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
 * Fallback (oude situatie): averageRating + reviewCount (Irisje), maar alléén als irisje* ontbreekt.
 */
function renderReviewBlock(company) {
  // Google
  const googleRating = toNumberOrNull(company.avgRating ?? company.googleRating);
  const googleCount = toIntOrZero(company.reviewCount ?? company.googleReviewCount);

  // Irisje (nieuw)
  const irisjeRatingNew = toNumberOrNull(company.irisjeAvgRating);
  const irisjeCountNew = toIntOrZero(company.irisjeReviewCount);

  // Irisje (oude fallback)
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
  const companySlug = params.get("companySlug");

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
  const isSearchMode = !requestId && !companySlug && !!category && !!city; // specialty is optioneel

  if (!isRequestMode && !isOfferFromCompanyMode && !isSearchMode) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  /* =========================
     ✔ Teller + max 5 (event delegation)
     ========================= */
  listEl.addEventListener("change", (e) => {
    const cb = e.target.closest(".company-checkbox");
    if (!cb) return;

    const checkedCount = listEl.querySelectorAll(".company-checkbox:checked").length;

    if (checkedCount > 5) {
      cb.checked = false;
      alert("Je kunt maximaal 5 bedrijven selecteren.");
    }

    updateSelectionUI();
  });

  /* =========================
     ✔ Modal openen (event delegation)
     ========================= */
  listEl.addEventListener("click", (e) => {
    const link = e.target.closest(".company-profile-link");
    if (!link) return;
    e.preventDefault();
    openCompanyModal(link.href, link.dataset.companyName);
  });

  function openCompanyModal(url, titleText) {
    storedScrollY = window.scrollY;
    modalUrl = url;
    if (modalTitle) modalTitle.textContent = titleText || "Bedrijfsprofiel";
    if (modalFrame) modalFrame.src = url;
    if (modalOverlay) modalOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeCompanyModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (modalFrame) modalFrame.src = "about:blank";
    modalUrl = "";
    document.body.style.overflow = "";
    window.scrollTo(0, storedScrollY);
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeCompanyModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeCompanyModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCompanyModal();
  });

  if (modalOpenNewTabBtn) {
    modalOpenNewTabBtn.addEventListener("click", () => {
      if (modalUrl) window.open(modalUrl, "_blank", "noopener");
    });
  }

  /* =========================
     Verzenden
     ========================= */
  function handleSendClick() {
    const selected = document.querySelectorAll(".company-checkbox:checked");
    if (!selected.length) return alert("Selecteer minimaal één bedrijf.");
    if (selected.length > 5) return alert("Je kunt maximaal 5 bedrijven selecteren.");

    const selectedCompanies = Array.from(selected)
      .map((cb) => {
        const card = cb.closest(".result-card");
        if (!card) return null;

        const nameEl = card.querySelector(".company-name a");
        const cityEl = card.querySelector(".company-city");

        return {
          id: cb.dataset.companyId,
          name: nameEl ? nameEl.textContent.trim() : "",
          city: cityEl ? cityEl.textContent.trim() : "",
        };
      })
      .filter(Boolean);

    sessionStorage.setItem("selectedCompaniesSummary", JSON.stringify(selectedCompanies));
    sessionStorage.setItem("selectedCompanyIds", JSON.stringify(selectedCompanies.map((c) => c.id)));

    if (requestId) {
      sessionStorage.setItem("requestId", requestId);
      window.location.href = `/request-send.html?requestId=${encodeURIComponent(requestId)}`;
      return;
    }

    // search-mode fallback
    window.location.href = `/request-send.html?category=${encodeURIComponent(category || "")}&specialty=${encodeURIComponent(
      specialty || ""
    )}&city=${encodeURIComponent(city || "")}`;
  }

  if (sendBtn) sendBtn.addEventListener("click", handleSendClick);

  /* =========================
     Data ophalen + renderen
     ========================= */
  try {
    stateEl.textContent = "Resultaten laden…";

    // MODE 2: offer-from-company (anchor + similar)
    if (isOfferFromCompanyMode) {
      if (subtitleEl) subtitleEl.textContent = "";

      const anchorRes = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(companySlug)}`, {
        cache: "no-store",
      });
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
        throw new Error(simData?.message || simData?.error || "Vergelijkbare bedrijven konden niet worden geladen");
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

    // MODE 1: request-mode
    if (isRequestMode) {
      const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error || "Request kon niet worden geladen");
      }

      const companies = Array.isArray(data.companies) ? data.companies : [];

      if (!companies.length) {
        stateEl.textContent = "Er zijn op dit moment geen bedrijven beschikbaar.";
        return;
      }

      stateEl.textContent = "";
      if (subtitleEl) {
        const c = (data.request?.category || "").trim();
        const s = (data.request?.specialty || "").trim();
        const ci = (data.request?.city || "").trim();
        const left = [c, s].filter(Boolean).join(" – ");
        subtitleEl.textContent = left && ci ? `Gebaseerd op jouw aanvraag voor ${left} in ${ci}.` : "Gebaseerd op jouw aanvraag.";
      }

      renderCompanies(companies, { anchorId: data.request?.companyId || null });

      // preselect (optioneel)
      const preselectedSlug = sessionStorage.getItem("preselectedCompanySlug");
      const checkbox = companyIdFromUrl
        ? listEl.querySelector(`.company-checkbox[data-company-id="${companyIdFromUrl}"]`)
        : preselectedSlug
        ? listEl.querySelector(`.company-checkbox[data-company-slug="${preselectedSlug}"]`)
        : null;

      if (checkbox) checkbox.checked = true;
      sessionStorage.removeItem("preselectedCompanySlug");

      updateSelectionUI();
      if (footerEl) footerEl.classList.remove("hidden");
      return;
    }

    // MODE 3: search-mode (category + city + optional specialty)
    {
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
        const cCategories = Array.isArray(c.categories) ? c.categories.map(normalize) : [];
        const cSpecialties = Array.isArray(c.specialties) ? c.specialties.map(normalize) : [];

        const cityOk = wantedCity ? cCity === wantedCity : true;
        const catOk = wantedCategory ? cCategories.includes(wantedCategory) : true;
        const specOk = wantedSpecialty ? cSpecialties.includes(wantedSpecialty) : true;

        return cityOk && catOk && specOk;
      });

      if (!filtered.length) {
        stateEl.textContent = "Er zijn op dit moment geen bedrijven beschikbaar.";
        return;
      }

      stateEl.textContent = "";
      if (subtitleEl) {
        const left = [category, specialty].filter(Boolean).join(" – ");
        subtitleEl.textContent = `Gebaseerd op jouw zoekopdracht: ${left} in ${city}.`;
      }

      renderCompanies(filtered);
      if (footerEl) footerEl.classList.remove("hidden");
    }
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
                ${
                  isAnchor || index === 0
                    ? `<span class="best-match-badge">Beste match</span>`
                    : ""
                }
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

  function normalize(v) {
    return String(v || "").trim().toLowerCase();
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
