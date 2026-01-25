// frontend/js/results.js
// Irisje.nl – Results page logic
// ✔ klikbare bedrijfsnamen (embed-profiel)
// ✔ juiste Irisje reviews
// ✔ Google reviews alleen indien aanwezig
// ✔ geen dubbele sterren

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

  /* ================= MODES ================= */

  async function runRequestMode(requestId) {
    const res = await fetch(`${API}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error("Aanvraag kon niet worden geladen");
    }

    const r = data.request;
    setSubtitle(`Gebaseerd op jouw aanvraag voor ${r.category}${r.city ? " in " + r.city : ""}.`);
    setState("ready");

    renderCompanies(data.companies || [], { anchorId: r.companyId || null });
  }

  async function runSearchMode({ category, city, specialty }) {
    const res = await fetch(`${API}/companies`);
    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error("Bedrijven konden niet worden geladen");
    }

    const filtered = data.companies.filter(c => {
      const cityOk = city ? norm(c.city) === norm(city) : true;
      const catOk  = category ? (c.categories || []).map(norm).includes(norm(category)) : true;
      const specOk = specialty ? (c.specialties || []).map(norm).includes(norm(specialty)) : true;
      return cityOk && catOk && specOk;
    });

    setSubtitle(`Gebaseerd op jouw zoekopdracht`);
    setState("ready");

    renderCompanies(filtered);
  }

  async function runOfferMode(slug) {
    const aRes = await fetch(`${API}/companies/slug/${encodeURIComponent(slug)}`);
    const aData = await aRes.json();
    if (!aRes.ok || !aData?.company) throw new Error("Ankerbedrijf niet gevonden");

    const sRes = await fetch(`${API}/companies-similar?anchorSlug=${encodeURIComponent(slug)}`);
    const sData = await sRes.json();
    if (!sRes.ok || !sData?.companies) throw new Error("Vergelijkbare bedrijven niet gevonden");

    setSubtitle(`Gebaseerd op jouw aanvraag bij ${aData.company.name}.`);
    setState("ready");

    renderCompanies(
      [aData.company, ...sData.companies.slice(0, 4)],
      { anchorId: aData.company._id }
    );
  }

  /* ================= RENDER ================= */

  function renderCompanies(companies, options = {}) {
    const list = document.getElementById("companiesList");
    list.innerHTML = "";

    if (!companies.length) {
      list.innerHTML = `<div class="empty-state">Geen geschikte bedrijven gevonden.</div>`;
      return;
    }

    companies.forEach(c => {
      const isAnchor = options.anchorId && String(c._id) === String(options.anchorId);

      const irisjeRating = num(c.avgRating ?? c.averageRating);
      const irisjeCount  = num(c.reviewCount);

      const googleRating = num(c.googleRating);
      const googleCount  = num(c.googleReviewCount);

      const card = document.createElement("div");
      card.className = `result-card${isAnchor ? " top-highlight" : ""}`;

      card.innerHTML = `
        ${isAnchor ? `<div class="pill pill-indigo">Beste match</div>` : ""}
        <h3>
          <a href="#" class="company-link" data-slug="${esc(c.slug)}">
            ${esc(c.name)}
          </a>
        </h3>
        <div class="result-city">${esc(c.city || "")}</div>

        <div class="ratings">
          ${irisjeRating !== null ? ratingLine("Irisje", irisjeRating, irisjeCount) : ""}
          ${googleRating !== null ? ratingLine("Google", googleRating, googleCount) : ""}
        </div>

        <label class="select-line">
          <input type="checkbox" class="company-checkbox" value="${c._id}">
          Selecteer
        </label>
      `;

      list.appendChild(card);

      const link = card.querySelector(".company-link");
      link.addEventListener("click", e => {
        e.preventDefault();
        openCompanyModal(c.slug);
      });
    });
  }

  function ratingLine(label, rating, count) {
    return `
      <div class="rating-line">
        <strong>${label}</strong>
        ${stars(rating)}
        <span>(${count ?? 0})</span>
      </div>
    `;
  }

  function stars(r) {
    r = clamp(r, 0, 5);
    let s = `<span class="star-rating">`;
    for (let i = 1; i <= 5; i++) {
      s += `<span class="star${i <= r ? " filled" : ""}">★</span>`;
    }
    return s + `</span>`;
  }

  /* ================= UI ================= */

  function openCompanyModal(slug) {
    const iframe = document.getElementById("companyModalIframe");
    const overlay = document.getElementById("companyModalOverlay");
    iframe.src = `/company.html?slug=${encodeURIComponent(slug)}&embed=1`;
    overlay.style.display = "flex";
  }

  function setState(state, msg = "") {
    const el = document.getElementById("resultsState");
    if (!el) return;
    el.style.display = state === "loading" ? "block" : "none";
    el.textContent = msg;
  }

  function showError(msg) {
    const el = document.getElementById("resultsState");
    if (el) el.textContent = msg;
  }

  function setSubtitle(t) {
    const el = document.getElementById("resultsSubtitle");
    if (el) el.textContent = t;
  }

  /* ================= HELPERS ================= */

  const norm = v => String(v || "").toLowerCase().trim();
  const num  = v => Number.isFinite(Number(v)) ? Number(v) : null;
  const clamp = (n,min,max) => Math.max(min, Math.min(max, n));
  const esc = s => String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
})();
