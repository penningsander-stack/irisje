// frontend/js/results.js
// Irisje.nl – results page logic (search mode + request mode + offer-from-company mode)
// Fixes:
// - Correct DOM ids (companiesList, resultsFooter, sendBtn, companyModalFrame, etc.)
// - Restores modal open link (embedded company profile)
// - Restores selection counter/footer behavior
// - Uses correct similar endpoint: /api/companies/similar?anchorSlug=...
// - Displays BOTH Irisje + Google ratings when available

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com/api";
  const MAX_SELECT = 5;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      const params = new URLSearchParams(window.location.search);

      const requestId = params.get("requestId");
      const category = params.get("category");
      const city = params.get("city");
      const specialty = params.get("specialty");
      const companySlug = params.get("companySlug");

      bindModal();
      bindFooter();

      setState("loading", "Bedrijven laden…");

      // MODE B: offer-from-company
      if (companySlug) {
        await runOfferMode(companySlug);
        return;
      }

      // MODE A2: requestId
      if (requestId) {
        await runRequestMode(requestId);
        return;
      }

      // MODE A1: search
      await runSearchMode({ category, city, specialty });
    } catch (err) {
      console.error(err);
      showError("Er ging iets mis bij het laden van de resultaten.");
    }
  }

  /* ============================================================
     MODE A2 — REQUEST MODE
     ============================================================ */
  async function runRequestMode(requestId) {
    const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.message || data.error)) || "Request kon niet worden geladen");
    }

    const request = data.request || {};
    const companies = Array.isArray(data.companies) ? data.companies : [];

    setText("resultsSubtitle", buildSubtitleFromRequest(request));
    setState("ready");

    renderCompanies(companies, { anchorId: request.companyId || null });
  }

  /* ============================================================
     MODE A1 — SEARCH MODE (category + city + specialty)
     Let op: als backend query ondersteunt: mooi. Zo niet: client-side filter.
     ============================================================ */
  async function runSearchMode({ category, city, specialty }) {
    // Probeer eerst server-side filtering (als jouw backend dit ondersteunt)
    const url = new URL(`${API_BASE}/companies`);
    if (category) url.searchParams.set("category", category);
    if (city) url.searchParams.set("city", city);
    if (specialty) url.searchParams.set("specialty", specialty);

    const res = await fetch(url.toString());
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true || !Array.isArray(data.companies)) {
      throw new Error("Bedrijven konden niet worden geladen");
    }

    // Extra veilige client-side filter (case-insensitive)
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

    setText("resultsSubtitle", buildSubtitleFromQuery({ category, city, specialty }));
    setState("ready");

    renderCompanies(filtered, { anchorId: null });
  }

  /* ============================================================
     MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF
     Endpoint similar: /api/companies/similar?anchorSlug=...
     ============================================================ */
  async function runOfferMode(anchorSlug) {
    // 1) anchor ophalen
    const anchorRes = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(anchorSlug)}`);
    const anchorData = await safeJson(anchorRes);

    if (!anchorRes.ok || !anchorData || anchorData.ok !== true || !anchorData.company) {
      throw new Error("Ankerbedrijf kon niet worden geladen");
    }

    const anchor = anchorData.company;

    // 2) similars ophalen (LET OP: route hangt onder /api/companies)
    const simRes = await fetch(
      `${API_BASE}/companies/similar?anchorSlug=${encodeURIComponent(anchor.slug)}`
    );
    const simData = await safeJson(simRes);

    if (!simRes.ok || !simData || simData.ok !== true) {
      throw new Error((simData && (simData.message || simData.error)) || "Vergelijkbare bedrijven konden niet worden geladen");
    }

    const similars = Array.isArray(simData.companies) ? simData.companies.slice(0, 4) : [];

    setText(
      "resultsSubtitle",
      `Gebaseerd op jouw aanvraag bij ${anchor.name}. Selecteer maximaal ${MAX_SELECT} bedrijven.`
    );
    setState("ready");

    renderCompanies([anchor, ...similars], { anchorId: anchor._id });
  }

  /* ============================================================
     RENDERING
     ============================================================ */
  function renderCompanies(companies, options = {}) {
    const list = document.getElementById("companiesList");
    if (!list) return;

    list.innerHTML = "";

    if (!Array.isArray(companies) || companies.length === 0) {
      list.innerHTML = `<div class="empty-state">Geen geschikte bedrijven gevonden.</div>`;
      updateFooterState();
      return;
    }

    const anchorId = options.anchorId ? String(options.anchorId) : null;

    companies.forEach((company) => {
      const isAnchor = anchorId && String(company._id) === anchorId;

      const name = escapeHtml(company.name || "Onbekend bedrijf");
      const city = escapeHtml(company.city || "");
      const slug = company.slug ? String(company.slug) : "";
      const categories = Array.isArray(company.categories) ? company.categories.filter(Boolean).join(" • ") : "";
      const tagline = company.tagline ? String(company.tagline) : "";

      const ratingHtml = renderReviewBlock(company);

      const card = document.createElement("div");
      card.className = `result-card${isAnchor ? " top-highlight" : ""}`;

      card.innerHTML = `
        <div class="result-header">
          <div class="result-main">
            ${isAnchor ? `<div class="pill pill-indigo">Beste match</div>` : ``}

            <div class="result-title">
              <a href="#" class="js-open-company" data-slug="${escapeHtml(slug)}">${name}</a>
            </div>

            ${city ? `<div class="result-location">${city}</div>` : ``}
            ${categories ? `<div class="result-categories">${escapeHtml(categories)}</div>` : ``}
            ${tagline ? `<div class="result-tagline">${escapeHtml(tagline)}</div>` : ``}
          </div>

          <div class="result-rating">
            ${ratingHtml}
          </div>
        </div>

        <div class="result-footer">
          <div class="result-actions">
            <label class="checkbox-label">
              <input type="checkbox" class="company-checkbox" value="${escapeHtml(String(company._id || ""))}">
              Selecteer
            </label>
            <span class="result-verified">${company.isVerified ? "Geverifieerd" : "Niet geverifieerd"}</span>
          </div>
        </div>
      `;

      list.appendChild(card);

      // Modal open link
      const openLink = card.querySelector(".js-open-company");
      if (openLink) {
        openLink.addEventListener("click", (e) => {
          e.preventDefault();
          if (slug) openCompanyModal(slug, company.name || "Bedrijfsprofiel");
        });
      }

      // Checkbox behaviour
      const cb = card.querySelector(".company-checkbox");
      if (cb) {
        cb.addEventListener("change", () => {
          enforceSelectionLimit(MAX_SELECT, cb);
          updateFooterState();
        });
      }
    });

    updateFooterState();
  }

  /* ============================================================
     REVIEWS / STARS (Google + Irisje)
     ============================================================ */
  function renderReviewBlock(company) {
    // Google (oude data in Company): avgRating + reviewCount  (maar kan overschreven worden in aggregaties)
    const googleRating = numberOrNull(company.googleRating ?? company.avgRating);
    const googleCount = numberOrNull(company.googleReviewCount ?? company.googleReviewcount ?? company.googleReviews);

    // Irisje (berekend uit Review-collectie): averageRating + irisjeReviewCount
    const irisjeRating = numberOrNull(company.averageRating ?? company.irisjeAverageRating ?? company.irisjeAvgRating);
    const irisjeCount = numberOrNull(company.irisjeReviewCount ?? company.irisjeReviewcount ?? company.irisjeReviews ?? company.irisjeCount);

    const parts = [];

    if (irisjeRating != null) {
      parts.push(`
        <div class="rating-line">
          <span class="pill pill-irisje">Irisje</span>
          <span class="rating-value">${formatOneDecimal(irisjeRating)}</span>
          ${renderStars(irisjeRating)}
          <span class="rating-count">(${irisjeCount ?? 0})</span>
        </div>
      `);
    }

    if (googleRating != null) {
      parts.push(`
        <div class="rating-line">
          <span class="pill pill-google">Google</span>
          <span class="rating-value">${formatOneDecimal(googleRating)}</span>
          ${renderStars(googleRating)}
          <span class="rating-count">(${googleCount ?? 0})</span>
        </div>
      `);
    }

    if (parts.length === 0) {
      return `<div class="result-reviewcount">Geen reviews</div>`;
    }

    return parts.join("");
  }

  function renderStars(ratingOutOfFive) {
    const r = clamp(Number(ratingOutOfFive) || 0, 0, 5);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fill = clamp(r - (i - 1), 0, 1);
      const pct = Math.round(fill * 100);
      stars.push(`
        <span class="star" aria-hidden="true">
          ★
          <span class="star-fill" style="width:${pct}%">★</span>
        </span>
      `);
    }
    return `<span class="star-rating" title="${formatOneDecimal(r)} / 5">${stars.join("")}</span>`;
  }

  /* ============================================================
     FOOTER (selectie)
     ============================================================ */
  function bindFooter() {
    const btn = document.getElementById("sendBtn");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const selected = getSelectedCompanyIds();

      if (selected.length === 0) {
        alert("Selecteer minimaal 1 bedrijf.");
        return;
      }

      // Hier geen aannames over jouw verzend-endpoint.
      alert(`Geselecteerd: ${selected.length} bedrijf(ven).`);
    });
  }

  function updateFooterState() {
    const footer = document.getElementById("resultsFooter");
    const countEl = document.getElementById("selectedCount");
    const btn = document.getElementById("sendBtn");

    const selected = getSelectedCompanyIds();

    if (countEl) countEl.textContent = `${selected.length} van ${MAX_SELECT} geselecteerd`;
    if (btn) btn.disabled = selected.length === 0;

    if (!footer) return;

    // In jouw HTML is de footer standaard "hidden"
    if (selected.length > 0) footer.classList.remove("hidden");
    else footer.classList.add("hidden");
  }

  function getSelectedCompanyIds() {
    return Array.from(document.querySelectorAll(".company-checkbox:checked"))
      .map((el) => el.value)
      .filter(Boolean);
  }

  function enforceSelectionLimit(max, changedCheckbox) {
    const checked = document.querySelectorAll(".company-checkbox:checked");
    if (checked.length <= max) return;

    if (changedCheckbox) changedCheckbox.checked = false;
    alert(`Je kunt maximaal ${max} bedrijven selecteren.`);
  }

  /* ============================================================
     MODAL
     ============================================================ */
  function bindModal() {
    const overlay = document.getElementById("companyModalOverlay");
    const closeBtn = document.getElementById("companyModalClose");
    const openNewTab = document.getElementById("companyModalOpenNewTab");

    if (closeBtn) closeBtn.addEventListener("click", closeCompanyModal);

    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeCompanyModal();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCompanyModal();
    });

    if (openNewTab) {
      openNewTab.addEventListener("click", (e) => {
        e.preventDefault();
        const frame = document.getElementById("companyModalFrame");
        if (!frame) return;
        const src = frame.getAttribute("src");
        if (src) window.open(src.replace("&embed=1", ""), "_blank", "noopener");
      });
    }
  }

  function openCompanyModal(slug, title) {
    const overlay = document.getElementById("companyModalOverlay");
    const frame = document.getElementById("companyModalFrame");
    const titleEl = document.getElementById("companyModalTitle");

    if (!overlay || !frame) return;

    if (titleEl) titleEl.textContent = title || "Bedrijfsprofiel";
    frame.src = `/company.html?slug=${encodeURIComponent(slug)}&embed=1`;

    overlay.setAttribute("aria-hidden", "false");
    overlay.style.display = "flex";
    document.body.classList.add("modal-open");
  }

  function closeCompanyModal() {
    const overlay = document.getElementById("companyModalOverlay");
    const frame = document.getElementById("companyModalFrame");
    if (!overlay) return;

    overlay.setAttribute("aria-hidden", "true");
    overlay.style.display = "none";
    document.body.classList.remove("modal-open");

    if (frame) frame.src = "about:blank";
  }

  /* ============================================================
     STATE / UI HELPERS
     ============================================================ */
  function setState(state, message = "") {
    const stateBox = document.getElementById("resultsState");
    if (!stateBox) return;

    if (state === "ready") {
      stateBox.classList.add("hidden");
      stateBox.innerHTML = "";
      return;
    }

    stateBox.classList.remove("hidden");

    if (state === "loading") {
      stateBox.innerHTML = `<div class="loading-state">${escapeHtml(message || "Laden…")}</div>`;
    } else {
      stateBox.innerHTML = `<div class="error-state">${escapeHtml(message || "Er ging iets mis.")}</div>`;
    }
  }

  function showError(message) {
    setState("error", message || "Er ging iets mis.");
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "";
  }

  function buildSubtitleFromRequest(request) {
    const parts = [];
    if (request.category) parts.push(request.category);
    if (request.specialty) parts.push(request.specialty);
    if (request.city) parts.push(request.city);

    if (parts.length === 0) return "Gebaseerd op jouw aanvraag.";
    // (category + specialty) in city
    const left = parts.slice(0, parts.length - 1).join(" – ");
    const right = parts[parts.length - 1];
    return `Gebaseerd op jouw aanvraag voor ${left ? left + " " : ""}in ${right}.`;
  }

  function buildSubtitleFromQuery({ category, city, specialty }) {
    const c = category ? String(category) : "";
    const s = specialty ? String(specialty) : "";
    const ci = city ? String(city) : "";

    const left = [c, s].filter(Boolean).join(" – ");
    const right = ci ? `in ${ci}` : "";

    if (!left && !right) return "Resultaten";
    return `Gebaseerd op jouw zoekopdracht: ${[left, right].filter(Boolean).join(" ")}.`;
  }

  /* ============================================================
     FETCH / FORMAT HELPERS
     ============================================================ */
  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  function normalize(v) {
    return String(v || "").trim().toLowerCase();
  }

  function numberOrNull(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function formatOneDecimal(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "0,0";
    return n.toFixed(1).replace(".", ",");
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
