// frontend/js/results.js
// Irisje.nl – results page logic (search mode + request mode + offer-from-company mode)
// - Preserves premium UI hooks: modal open, footer counter, selection limit
// - Restores dual ratings: Google (avgRating/reviewCount) + Irisje (irisjeAvgRating/irisjeReviewCount)

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

      const embed = params.get("embed") === "1";
      if (embed) document.body.classList.add("embed-mode");

      bindModal();
      bindFooter();

      setState("loading", "Bedrijven laden…");

      // MODE B: offer-from-company (anchor via slug + up to 4 similars)
      if (companySlug) {
        await runOfferMode(companySlug);
        return;
      }

      // MODE A2: request-based results (preferred when requestId exists)
      if (requestId) {
        await runRequestMode(requestId);
        return;
      }

      // MODE A1: direct search mode (category + city + specialty)
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
    const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true) {
      throw new Error((data && (data.message || data.error)) || "Request kon niet worden geladen");
    }

    const request = data.request || {};
    const companies = Array.isArray(data.companies) ? data.companies : [];

    setText("resultsSubtitle", buildSubtitleFromRequest(request));
    setState("ready");

    showNoLocalNotice(!!data.noLocalResults);

    // Anchor bovenaan markeren als backend companyId meegeeft
    renderCompanies(companies, { anchorId: request.companyId || null });
  }

  /* ============================================================
     MODE A1 — SEARCH MODE (category + city + specialty)
     Let op: /api/companies geeft alle bedrijven; we filteren client-side.
     ============================================================ */
  async function runSearchMode({ category, city, specialty }) {
    const res = await fetch(`${API_BASE}/companies`);
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
     Endpoint: /api/companies-similar?anchorSlug=...
     ============================================================ */
  async function runOfferMode(anchorSlug) {
    // 1) anchor ophalen via bestaande companies/slug route
    const anchorRes = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(anchorSlug)}`);
    const anchorData = await safeJson(anchorRes);

    if (!anchorRes.ok || !anchorData || anchorData.ok !== true || !anchorData.company) {
      throw new Error("Ankerbedrijf kon niet worden geladen");
    }

    const anchor = anchorData.company;

    // 2) similars ophalen via companies-similar
    const simRes = await fetch(`${API_BASE}/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`);
    const simData = await safeJson(simRes);

    if (!simRes.ok || !simData || simData.ok !== true) {
      throw new Error((simData && (simData.message || simData.error)) || "Vergelijkbare bedrijven konden niet worden geladen");
    }

    const similars = Array.isArray(simData.companies) ? simData.companies.slice(0, 4) : [];

    setText("resultsSubtitle", `Gebaseerd op jouw aanvraag bij ${anchor.name}. Selecteer maximaal ${MAX_SELECT} bedrijven.`);
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

      // Google ratings (historisch in Company opgeslagen)
      const googleRating = numberOrNull(company.avgRating);
      const googleCount = numberOrNull(company.reviewCount);

      // Irisje ratings (door backend toegevoegd in publicRequests-mode)
      const irisjeRating =
        numberOrNull(company.irisjeAvgRating) ??
        numberOrNull(company.averageRating); // fallback indien oudere backend keys bestaan
      const irisjeCount =
        numberOrNull(company.irisjeReviewCount) ??
        numberOrNull(company.irisjeCount);

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
              <a href="#" class="js-open-company result-link" data-slug="${escapeHtml(slug)}">${name}</a>
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
              <input type="checkbox" class="company-checkbox" value="${escapeHtml(String(company._id || ""))}">
              Selecteer
            </label>
            ${company.isVerified ? `<span class="result-verified">Geverifieerd</span>` : `<span class="result-verified">Niet geverifieerd</span>`}
          </div>
        </div>
      `;

      list.appendChild(card);

      const openBtn = card.querySelector(".js-open-company");
      if (openBtn) {
        openBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const s = openBtn.getAttribute("data-slug") || "";
          if (s) openCompanyModal(s);
        });
      }

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

  function buildRatingBlock({ googleRating, googleCount, irisjeRating, irisjeCount }) {
    const rows = [];

    // Irisje eerst tonen
    if (irisjeRating != null) {
      rows.push(renderRatingRow("Irisje", irisjeRating, irisjeCount ?? 0, "pill-irisje"));
    }

    // Google daarna
    if (googleRating != null) {
      rows.push(renderRatingRow("Google", googleRating, googleCount ?? 0, "pill-google"));
    }

    if (rows.length === 0) return `<div class="result-reviewcount">Geen reviews</div>`;
    return rows.join("");
  }

  function renderRatingRow(label, rating, count, pillClass) {
    return `
      <div class="rating-line">
        <span class="pill ${pillClass}">${escapeHtml(label)}</span>
        <span class="rating-value">${formatOneDecimal(rating)}</span>
        ${renderStarsSvg(rating)}
        <span class="rating-count">(${Number.isFinite(Number(count)) ? Number(count) : 0})</span>
      </div>
    `;
  }

  // SVG stars (geen dubbele ★ bij kopiëren/plakken)
  function renderStarsSvg(ratingOutOfFive) {
    const r = clamp(Number(ratingOutOfFive) || 0, 0, 5);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const fill = clamp(r - (i - 1), 0, 1);
      const pct = Math.round(fill * 100);
      stars.push(starSvg(pct, i));
    }
    return `<span class="star-rating" aria-label="${formatOneDecimal(r)} van 5">${stars.join("")}</span>`;
  }

  function starSvg(percent, idx) {
    const clipId = `clip_${idx}_${Math.random().toString(16).slice(2)}`;
    return `
      <svg class="star-svg" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <clipPath id="${clipId}">
            <rect x="0" y="0" width="${(24 * percent) / 100}" height="24"></rect>
          </clipPath>
        </defs>
        <path class="star-bg" fill="#e5e7eb" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
        <path class="star-fg" fill="#f59e0b" clip-path="url(#${clipId})" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
      </svg>
    `;
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

      alert(`Geselecteerd: ${selectedIds.length} bedrijf(ven).`);
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
    footer.style.display = selected.length > 0 ? "flex" : "none";
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
     MODAL (embed company.html)
     ============================================================ */
  function bindModal() {
    const overlay = document.getElementById("companyModalOverlay");
    const closeBtn = document.getElementById("companyModalClose");
    const openNewTab = document.getElementById("companyModalOpenNewTab");
    const frame = document.getElementById("companyModalFrame");

    if (closeBtn) closeBtn.addEventListener("click", closeCompanyModal);
    if (overlay) overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCompanyModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCompanyModal();
    });

    if (openNewTab && frame) {
      openNewTab.addEventListener("click", (e) => {
        e.preventDefault();
        const src = frame.getAttribute("src");
        if (src) window.open(src.replace("&embed=1", ""), "_blank", "noopener");
      });
    }
  }

  function openCompanyModal(slug) {
    const overlay = document.getElementById("companyModalOverlay");
    const frame = document.getElementById("companyModalFrame");
    const title = document.getElementById("companyModalTitle");

    if (!overlay || !frame) return;

    if (title) title.textContent = slug;
    frame.src = `/company.html?slug=${encodeURIComponent(slug)}&embed=1`;

    overlay.style.display = "flex";
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
    el.style.display = show ? "block" : "none";
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
