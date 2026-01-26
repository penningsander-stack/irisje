// frontend/js/results.js
// Irisje.nl – results page logic (search mode + request mode + offer-from-company mode)
// Fixes: companySlug-mode, requestId-mode, modal id mismatch (companyModalFrame),
// selection footer/teller, clickable company names (embed profiel), correct Google label.

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
      bindListEvents();

      setState("loading", "Bedrijven laden…");

      // MODE B: offer-from-company (anchor via slug + similars)
      if (companySlug) {
        await runOfferMode(companySlug);
        return;
      }

      // MODE A2: request-based results
      if (requestId) {
        await runRequestMode(requestId);
        return;
      }

      // MODE A1: direct search mode
      await runSearchMode({ category, city, specialty });
    } catch (err) {
      console.error(err);
      showError("Er ging iets mis bij het laden van de resultaten.");
    }
  }

  /* ============================================================
     MODE A2 — REQUEST MODE (op basis van requestId)
     ============================================================ */
  async function runRequestMode(requestId) {
    const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`, {
      cache: "no-store",
    });
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.message || data.error)) || "Request kon niet worden geladen");
    }

    const request = data.request || {};
    const companies = Array.isArray(data.companies) ? data.companies : [];

    setText("resultsSubtitle", buildSubtitleFromRequest(request));
    setState("ready");

    showNoLocalNotice(!!data.noLocalResults);

    renderCompanies(companies, { anchorId: request.companyId || null });
  }

  /* ============================================================
     MODE A1 — SEARCH MODE (category + city + specialty)
     Let op: /api/companies geeft bedrijven; we filteren client-side.
     ============================================================ */
  async function runSearchMode({ category, city, specialty }) {
    const res = await fetch(`${API_BASE}/companies`, { cache: "no-store" });
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true || !Array.isArray(data.companies)) {
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

    setText("resultsSubtitle", buildSubtitleFromQuery({ category, city, specialty }));
    setState("ready");
    showNoLocalNotice(false);

    renderCompanies(filtered);
  }

  /* ============================================================
     MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF (anchorSlug + similars)
     Endpoints:
     - /api/companies/slug/:slug
     - /api/companies/similar?anchorSlug=...
     ============================================================ */
  async function runOfferMode(anchorSlug) {
    const anchorRes = await fetch(
      `${API_BASE}/companies/slug/${encodeURIComponent(anchorSlug)}`,
      { cache: "no-store" }
    );
    const anchorData = await safeJson(anchorRes);

    if (!anchorRes.ok || !anchorData || anchorData.ok !== true || !anchorData.company) {
      throw new Error("Ankerbedrijf kon niet worden geladen");
    }

    const anchor = anchorData.company;

    const simRes = await fetch(
      `${API_BASE}/companies/similar?anchorSlug=${encodeURIComponent(anchor.slug)}`,
      { cache: "no-store" }
    );
    const simData = await safeJson(simRes);

    if (!simRes.ok || !simData || simData.ok !== true) {
      throw new Error((simData && simData.message) || "Vergelijkbare bedrijven konden niet worden geladen");
    }

    const similars = Array.isArray(simData.companies) ? simData.companies.slice(0, 4) : [];

    setText(
      "resultsSubtitle",
      `Gebaseerd op jouw aanvraag bij ${anchor.name}. Selecteer maximaal ${MAX_SELECT} bedrijven.`
    );
    setState("ready");
    showNoLocalNotice(false);

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

    const anchorId = options.anchorId || null;

    companies.forEach((company) => {
      const isAnchor = !!anchorId && String(company._id) === String(anchorId);

      const card = document.createElement("div");
      card.className = `result-card${isAnchor ? " top-highlight" : ""}`;

      const name = escapeHtml(company.name || "Onbekend bedrijf");
      const city = escapeHtml(company.city || "");
      const categories = Array.isArray(company.categories) ? company.categories.join(" • ") : "";
      const tagline = company.tagline ? String(company.tagline) : "";
      const slug = company.slug ? String(company.slug) : "";
      const id = company._id ? String(company._id) : "";

      // Google (jouw huidige backend-model gebruikt avgRating + reviewCount hiervoor)
      const googleRating = numberOrNull(company.avgRating);
      const googleCount = intOrZero(company.reviewCount);

      // Irisje (alleen tonen als backend echt aparte velden meegeeft)
      // We accepteren meerdere mogelijke veldnamen om compatibel te blijven.
      const irisjeRating =
        numberOrNull(company.irisjeAvgRating) ??
        numberOrNull(company.irisjeRating) ??
        numberOrNull(company.averageRating) ??
        null;

      const irisjeCount =
        intOrZero(company.irisjeReviewCount) ||
        intOrZero(company.irisjeCount) ||
        intOrZero(company.irisjeReviews) ||
        0;

      const ratingHtml = buildRatingBlock({
        googleRating,
        googleCount,
        irisjeRating,
        irisjeCount,
      });

      card.innerHTML = `
        <div class="result-header">
          <div>
            ${isAnchor ? `<div class="pill pill-indigo">Beste match</div>` : ``}

            <div class="result-title">
              ${
                slug
                  ? `<a href="#" class="js-open-company" data-slug="${escapeHtml(slug)}">${name}</a>`
                  : `<span>${name}</span>`
              }
            </div>

            <div class="result-location">${city}</div>
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
              <input type="checkbox" class="company-checkbox" value="${escapeHtml(id)}">
              Selecteer
            </label>
            ${
              company.isVerified
                ? `<span class="result-verified">Geverifieerd</span>`
                : `<span class="result-verified">Niet geverifieerd</span>`
            }
          </div>
        </div>
      `;

      list.appendChild(card);
    });

    updateFooterState();
  }

  function buildRatingBlock({ googleRating, googleCount, irisjeRating, irisjeCount }) {
    const parts = [];

    // Google: altijd labelen als Google (dit zijn jouw bestaande velden)
    if (googleRating != null) {
      parts.push(`
        <div class="rating-line">
          <span class="pill pill-google">Google</span>
          <span class="rating-value">${formatOneDecimal(googleRating)}</span>
          ${renderStars(googleRating)}
          <span class="rating-count">(${googleCount})</span>
        </div>
      `);
    }

    // Irisje: alleen tonen als er echte Irisje-velden zijn meegeleverd
    if (irisjeRating != null && irisjeCount > 0) {
      parts.push(`
        <div class="rating-line">
          <span class="pill pill-irisje">Irisje</span>
          <span class="rating-value">${formatOneDecimal(irisjeRating)}</span>
          ${renderStars(irisjeRating)}
          <span class="rating-count">(${irisjeCount})</span>
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
      const fill = clamp(r - (i - 1), 0, 1); // 0..1
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
     LIST EVENTS (modal open + checkbox limit) — event delegation
     ============================================================ */
  function bindListEvents() {
    const list = document.getElementById("companiesList");
    if (!list) return;

    list.addEventListener("click", (e) => {
      const link = e.target.closest(".js-open-company");
      if (!link) return;
      e.preventDefault();
      const slug = link.getAttribute("data-slug") || "";
      if (slug) openCompanyModal(slug);
    });

    list.addEventListener("change", (e) => {
      const cb = e.target.closest(".company-checkbox");
      if (!cb) return;

      enforceSelectionLimit(MAX_SELECT, cb);
      updateFooterState();
    });
  }

  /* ============================================================
     FOOTER (selectie)
     ============================================================ */
  function bindFooter() {
    const btn = document.getElementById("sendBtn");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();

      const selectedIds = getSelectedCompanyIds();
      if (selectedIds.length === 0) {
        alert("Selecteer minimaal 1 bedrijf.");
        return;
      }

      alert(
        `Geselecteerd: ${selectedIds.length} bedrijf(ven).\n\n` +
          `Koppel deze knop pas aan jouw bestaande verzend-flow als je exact aangeeft welk endpoint/route nu gebruikt moet worden.`
      );
    });
  }

  function updateFooterState() {
    const selected = getSelectedCompanyIds();
    const footer = document.getElementById("resultsFooter");
    const countEl = document.getElementById("selectedCount");
    const btn = document.getElementById("sendBtn");

    if (countEl) countEl.textContent = `${selected.length} van ${MAX_SELECT} geselecteerd`;
    if (btn) btn.disabled = selected.length === 0;

    if (!footer) return;
    footer.classList.toggle("hidden", selected.length === 0);
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
     MODAL (matcht results.html: companyModalFrame)
     ============================================================ */
  function bindModal() {
    const overlay = document.getElementById("companyModalOverlay");
    const closeBtn = document.getElementById("companyModalClose");
    const openNewTab = document.getElementById("companyModalOpenNewTab");
    const frame = document.getElementById("companyModalFrame");

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
        if (!frame) return;
        const src = frame.getAttribute("src");
        if (src) window.open(src.replace("&embed=1", ""), "_blank", "noopener");
      });
    }
  }

  function openCompanyModal(slug) {
    const overlay = document.getElementById("companyModalOverlay");
    const frame = document.getElementById("companyModalFrame");
    if (!overlay || !frame) return;

    frame.src = `/company.html?slug=${encodeURIComponent(slug)}&embed=1`;
    overlay.style.display = "block";
    document.body.classList.add("modal-open");
  }

  function closeCompanyModal() {
    const overlay = document.getElementById("companyModalOverlay");
    const frame = document.getElementById("companyModalFrame");
    if (!overlay) return;

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

    stateBox.style.display = state === "ready" ? "none" : "block";

    if (state === "loading") {
      stateBox.innerHTML = `<div class="loading-state">${escapeHtml(message || "Laden…")}</div>`;
    } else if (state === "error") {
      stateBox.innerHTML = `<div class="error-state">${escapeHtml(message || "Er ging iets mis.")}</div>`;
    } else {
      stateBox.innerHTML = "";
    }
  }

  function showError(message) {
    setState("error", message || "Er ging iets mis.");
  }

  function showNoLocalNotice(show) {
    const el = document.getElementById("noLocalNotice");
    if (!el) return;

    if (!show) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }

    el.textContent = "Geen lokale resultaten gevonden. We tonen bedrijven uit de omgeving.";
    el.classList.remove("hidden");
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
    return `Gebaseerd op jouw aanvraag voor ${parts.join(" in ")}.`;
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

  function intOrZero(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.floor(n));
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
