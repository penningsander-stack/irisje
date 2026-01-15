// frontend/js/results.js
// Stap 2B – Advocaat = hoofdcategorie (incl. juridische specialisaties)

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const footerEl = document.getElementById("resultsFooter");

  const selected = new Set();

  const SECTOR_MAP = {
    advocaat: [
      // hoofd
      "advocaat", "advocaten", "advocatuur", "law", "lawyer", "lawyers", "legal",
      // specialisaties
      "arbeidsrecht", "strafrecht", "letselschade", "familierecht",
      "huurrecht", "bestuursrecht", "ondernemingsrecht", "vastgoedrecht",
      "privacyrecht", "asielrecht", "vreemdelingenrecht"
    ],
    hovenier: ["hovenier", "tuin", "tuinen", "tuinaanleg", "tuinonderhoud", "groen"],
    loodgieter: ["loodgieter", "installateur", "sanitair", "cv", "riolering", "lekkage"],
    elektricien: ["elektricien", "elektra", "groepenkast", "stroom", "installatietechniek"]
  };

  init();

  async function init() {
    showLoading();

    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    const url = requestId
      ? `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`
      : `${API_BASE}/publicRequests/latest`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      if (!data.request || !Array.isArray(data.companies)) {
        throw new Error("Invalid API response");
      }

      const request = data.request;
      const companies = data.companies;

      const sectorLabel = request.sector || request.category || "";
      const cityLabel = request.city || "";

      subtitleEl.textContent =
        sectorLabel && cityLabel
          ? `Gebaseerd op jouw aanvraag voor ${sectorLabel} in ${cityLabel}.`
          : "";

      // 1️⃣ exacte plaats
      let results = filterCompanies(companies, request, true);

      // 2️⃣ fallback: andere plaatsen
      if (results.length === 0) {
        results = filterCompanies(companies, request, false);

        if (results.length > 0) {
          stateEl.innerHTML = `
            <h2>Geen bedrijven in ${escapeHtml(cityLabel)} gevonden</h2>
            <p>Deze bedrijven zitten iets verder weg, maar werken ook in jouw regio.</p>
          `;
        } else {
          showEmpty();
          return;
        }
      } else {
        stateEl.textContent = "";
      }

      renderCompanies(results);
      footerEl.classList.remove("hidden");
      updateFooter();

    } catch (e) {
      console.error("RESULTS ERROR:", e);
      showNoRequest();
    }
  }

  function filterCompanies(companies, request, exactCity) {
    const sectorKey = normalize(request.sector || request.category || "");
    const city = normalize(request.city || "");

    const allowed = SECTOR_MAP[sectorKey] || [];

    return companies
      .filter(c => {
        const tokens = getCompanyTokens(c);
        return tokens.some(t => allowed.includes(t));
      })
      .filter(c => {
        if (!exactCity) return true;
        return normalize(c.city) === city;
      })
      .sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));
  }

  function getCompanyTokens(c) {
    const values = [];
    add(values, c.sector);
    add(values, c.category);
    return [...new Set(values.map(normalize))].filter(Boolean);
  }

  function add(arr, val) {
    if (!val) return;
    if (Array.isArray(val)) return val.forEach(v => add(arr, v));
    String(val).split(/[,/|•·–-]/).forEach(v => arr.push(v));
  }

  function normalize(v) {
    return String(v || "").toLowerCase().trim();
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach(c => {
      const card = document.createElement("div");
      card.className = "company-card";
      card.innerHTML = `
        <label>
          <input type="checkbox">
          <strong>${escapeHtml(c.name)}</strong><br>
          <span class="muted">${escapeHtml(c.city)}</span>
        </label>
      `;

      const cb = card.querySelector("input");
      cb.addEventListener("change", () => toggle(c._id, cb));
      listEl.appendChild(card);
    });
  }

  function toggle(id, cb) {
    if (cb.checked) {
      if (selected.size >= 5) {
        cb.checked = false;
        return;
      }
      selected.add(id);
    } else {
      selected.delete(id);
    }
    updateFooter();
  }

  function updateFooter() {
    countEl.textContent = `${selected.size} van 5 geselecteerd`;
    sendBtn.disabled = selected.size === 0;
  }

  function showLoading() {
    stateEl.textContent = "Geschikte bedrijven worden geladen…";
    footerEl.classList.add("hidden");
  }

  function showEmpty() {
    stateEl.innerHTML = `
      <h2>Geen geschikte bedrijven gevonden</h2>
      <p>Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.</p>
    `;
    footerEl.classList.add("hidden");
  }

  function showNoRequest() {
    stateEl.innerHTML = `
      <h2>Geen aanvraag gevonden</h2>
      <p>Er is nog geen aanvraag beschikbaar.</p>
      <a href="/request.html" class="btn-primary">Start een nieuwe aanvraag</a>
    `;
    footerEl.classList.add("hidden");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
});
