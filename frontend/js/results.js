// frontend/js/results.js
// Irisje.nl – Results page logic (search, request, offer-from-company)
// ✔ fixes missing state handlers
// ✔ restores Irisje + Google reviews
// ✔ correct city/category filtering
// ✔ stable star rendering (5 visible, overlay-fill)

(() => {
  "use strict";

  const API = "https://irisje-backend.onrender.com/api";

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    try {
      const params = new URLSearchParams(window.location.search);

      const requestId   = params.get("requestId");
      const category    = params.get("category");
      const city        = params.get("city");
      const specialty  = params.get("specialty");
      const companySlug = params.get("companySlug");

      setState("loading", "Bedrijven laden…");

      if (companySlug) {
        await runOfferMode(companySlug);
        return;
      }

      if (requestId) {
        await runRequestMode(requestId);
        return;
      }

      await runSearchMode({ category, city, specialty });

    } catch (err) {
      console.error(err);
      showError("Er ging iets mis bij het laden van de resultaten.");
    }
  }

  /* ============================================================
     REQUEST MODE
     ============================================================ */
  async function runRequestMode(requestId) {
    const res = await fetch(`${API}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true) {
      throw new Error("Aanvraag kon niet worden geladen");
    }

    setSubtitle(`Gebaseerd op jouw aanvraag voor ${data.request.category} in ${data.request.city}.`);
    setState("ready");

    renderCompanies(data.companies || [], {
      anchorId: data.request.companyId || null
    });
  }

  /* ============================================================
     SEARCH MODE
     ============================================================ */
  async function runSearchMode({ category, city, specialty }) {
    const res = await fetch(`${API}/companies`);
    const data = await safeJson(res);

    if (!res.ok || !data || data.ok !== true) {
      throw new Error("Bedrijven konden niet worden geladen");
    }

    const wantedCategory  = normalize(category);
    const wantedCity      = normalize(city);
    const wantedSpecialty = normalize(specialty);

    const filtered = data.companies.filter(c => {
      const cityOk = wantedCity ? normalize(c.city) === wantedCity : true;
      const catOk  = wantedCategory ? (c.categories || []).map(normalize).includes(wantedCategory) : true;
      const specOk = wantedSpecialty ? (c.specialties || []).map(normalize).includes(wantedSpecialty) : true;
      return cityOk && catOk && specOk;
    });

    setSubtitle(`Gebaseerd op jouw zoekopdracht: ${category} in ${city}.`);
    setState("ready");

    renderCompanies(filtered);
  }

  /* ============================================================
     OFFER MODE (companySlug)
     ============================================================ */
  async function runOfferMode(slug) {
    const anchorRes = await fetch(`${API}/companies/slug/${encodeURIComponent(slug)}`);
    const anchorData = await safeJson(anchorRes);

    if (!anchorRes.ok || !anchorData?.company) {
      throw new Error("Ankerbedrijf niet gevonden");
    }

    const simRes = await fetch(`${API}/companies/similar?anchorSlug=${encodeURIComponent(slug)}`);
    const simData = await safeJson(simRes);

    if (!simRes.ok || !simData?.companies) {
      throw new Error("Vergelijkbare bedrijven konden niet worden geladen");
    }

    setSubtitle(`Gebaseerd op jouw aanvraag bij ${anchorData.company.name}.`);
    setState("ready");

    renderCompanies(
      [anchorData.company, ...simData.companies.slice(0, 4)],
      { anchorId: anchorData.company._id }
    );
  }

  /* ============================================================
     RENDERING
     ============================================================ */
  function renderCompanies(companies, options = {}) {
    const list = document.getElementById("companiesList");
    list.innerHTML = "";

    if (!companies.length) {
      list.innerHTML = `<div class="empty-state">Geen geschikte bedrijven gevonden.</div>`;
      return;
    }

    companies.forEach(company => {
      const isAnchor = options.anchorId && company._id === options.anchorId;

      const irisjeRating = number(company.avgRating);
      const irisjeCount  = number(company.reviewCount);

      const googleRating = number(company.googleRating);
      const googleCount  = number(company.googleReviewCount);

      const card = document.createElement("div");
      card.className = `result-card${isAnchor ? " top-highlight" : ""}`;

      card.innerHTML = `
        ${isAnchor ? `<div class="pill pill-indigo">Beste match</div>` : ""}
        <h3>${escape(company.name)}</h3>
        <div>${escape(company.city)}</div>

        <div class="ratings">
          ${renderRatingLine("Irisje", irisjeRating, irisjeCount)}
          ${googleRating !== null ? renderRatingLine("Google", googleRating, googleCount) : ""}
        </div>

        <label>
          <input type="checkbox" class="company-checkbox" value="${company._id}">
          Selecteer
        </label>
      `;

      list.appendChild(card);
    });
  }

  function renderRatingLine(label, rating, count) {
    if (rating === null) {
      return `<div class="rating-line">${label}: geen reviews</div>`;
    }

    return `
      <div class="rating-line">
        <strong>${label}</strong>
        ${renderStars(rating)}
        <span>(${count || 0})</span>
      </div>
    `;
  }

  function renderStars(rating) {
    const r = clamp(rating, 0, 5);
    let html = `<span class="star-rating">`;

    for (let i = 1; i <= 5; i++) {
      const fill = clamp(r - (i - 1), 0, 1);
      const pct = Math.round(fill * 100);

      html += `
        <span class="star">
          ★
          <span class="star-fill" style="width:${pct}%">★</span>
        </span>
      `;
    }

    html += `</span>`;
    return html;
  }

  /* ============================================================
     UI HELPERS
     ============================================================ */
  function setState(state, message = "") {
    const el = document.getElementById("resultsState");
    if (!el) return;

    if (state === "loading") {
      el.style.display = "block";
      el.textContent = message;
    } else {
      el.style.display = "none";
      el.textContent = "";
    }
  }

  function showError(msg) {
    const el = document.getElementById("resultsState");
    if (!el) return;
    el.style.display = "block";
    el.textContent = msg;
  }

  function setSubtitle(text) {
    const el = document.getElementById("resultsSubtitle");
    if (el) el.textContent = text;
  }

  /* ============================================================
     UTIL
     ============================================================ */
  async function safeJson(res) {
    try { return await res.json(); }
    catch { return null; }
  }

  function normalize(v) {
    return String(v || "").toLowerCase().trim();
  }

  function number(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function escape(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
