// frontend/js/results.js
// Irisje.nl – Results page logic (search, request, offer-from-company)
// ✔ correcte Irisje + Google reviews
// ✔ geen dubbele sterren in DOM
// ✔ veilige filtering op city/category/specialty

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
      const specialty   = params.get("specialty");
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

  /* ================= REQUEST MODE ================= */

  async function runRequestMode(requestId) {
    const res = await fetch(`${API}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await safeJson(res);

    if (!res.ok || !data?.ok) {
      throw new Error("Aanvraag kon niet worden geladen");
    }

    const r = data.request;
    setSubtitle(`Gebaseerd op jouw aanvraag voor ${r.category}${r.city ? " in " + r.city : ""}.`);
    setState("ready");

    renderCompanies(data.companies || [], { anchorId: r.companyId || null });
  }

  /* ================= SEARCH MODE ================= */

  async function runSearchMode({ category, city, specialty }) {
    const res = await fetch(`${API}/companies`);
    const data = await safeJson(res);

    if (!res.ok || !data?.ok) {
      throw new Error("Bedrijven konden niet worden geladen");
    }

    const filtered = data.companies.filter(c => {
      const cityOk = city ? normalize(c.city) === normalize(city) : true;
      const catOk  = category ? (c.categories || []).map(normalize).includes(normalize(category)) : true;
      const specOk = specialty ? (c.specialties || []).map(normalize).includes(normalize(specialty)) : true;
      return cityOk && catOk && specOk;
    });

    const parts = [];
    if (category) parts.push(category);
    if (specialty) parts.push(specialty);
    if (city) parts.push(`in ${city}`);

    setSubtitle(parts.length ? `Gebaseerd op jouw zoekopdracht: ${parts.join(" ")}` : "Resultaten");
    setState("ready");

    renderCompanies(filtered);
  }

  /* ================= OFFER MODE ================= */

  async function runOfferMode(slug) {
    const anchorRes = await fetch(`${API}/companies/slug/${encodeURIComponent(slug)}`);
    const anchorData = await safeJson(anchorRes);

    if (!anchorRes.ok || !anchorData?.company) {
      throw new Error("Ankerbedrijf niet gevonden");
    }

    const simRes = await fetch(`${API}/companies-similar?anchorSlug=${encodeURIComponent(slug)}`);
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

  /* ================= RENDERING ================= */

  function renderCompanies(companies, options = {}) {
    const list = document.getElementById("companiesList");
    list.innerHTML = "";

    if (!companies.length) {
      list.innerHTML = `<div class="empty-state">Geen geschikte bedrijven gevonden.</div>`;
      return;
    }

    companies.forEach(c => {
      const isAnchor = options.anchorId && String(c._id) === String(options.anchorId);

      // Irisje reviews (backend bevestigd)
      const irisjeRating = number(c.averageRating);
      const irisjeCount  = number(c.reviewCount);

      // Google reviews (optioneel)
      const googleRating = number(c.avgRating);
      const googleCount  = number(c.googleReviewCount);

      const card = document.createElement("div");
      card.className = `result-card${isAnchor ? " top-highlight" : ""}`;

      card.innerHTML = `
        ${isAnchor ? `<div class="pill pill-indigo">Beste match</div>` : ""}
        <h3>${escape(c.name)}</h3>
        <div class="result-city">${escape(c.city || "")}</div>

        <div class="ratings">
          ${irisjeRating !== null ? renderRatingLine("Irisje", irisjeRating, irisjeCount) : ""}
          ${googleRating !== null ? renderRatingLine("Google", googleRating, googleCount) : ""}
        </div>

        <label class="select-line">
          <input type="checkbox" class="company-checkbox" value="${c._id}">
          Selecteer
        </label>
      `;

      list.appendChild(card);
    });
  }

  function renderRatingLine(label, rating, count) {
    return `
      <div class="rating-line">
        <span class="rating-label">${label}</span>
        ${renderStars(rating)}
        <span class="rating-count">(${count ?? 0})</span>
      </div>
    `;
  }

  function renderStars(rating) {
    const r = clamp(rating, 0, 5);
    let html = `<span class="star-rating" aria-label="${r} van 5">`;
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star${i <= r ? " filled" : ""}">★</span>`;
    }
    html += `</span>`;
    return html;
  }

  /* ================= UI HELPERS ================= */

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

  /* ================= UTIL ================= */

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
