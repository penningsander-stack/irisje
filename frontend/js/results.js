// frontend/js/results.js
// Resultatenpagina met sector-normalisatie + geografische fallback (Stap 2)

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const footerEl = document.getElementById("resultsFooter");

  // Sector-normalisatie
  const SECTOR_MAP = {
    advocaat: ["advocaat", "advocatuur", "juridisch", "law", "lawyer", "lawyers", "legal", "advocaten"],
    hovenier: ["hovenier", "tuin", "tuinen", "tuinonderhoud", "tuinaanleg", "groen", "groenvoorziening", "tuinier"],
    loodgieter: ["loodgieter", "installateur", "installatie", "sanitair", "cv", "verwarming", "riolering", "lekkage"],
    elektricien: ["elektricien", "elektra", "elektrisch", "installatietechniek", "stroom", "groepenkast"]
  };

  const selected = new Set();

  if (!listEl || !stateEl || !subtitleEl || !countEl || !sendBtn || !footerEl) {
    console.error("results.js: vereiste DOM-elementen ontbreken");
    return;
  }

  init();

  async function init() {
    showLoading();

    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    const url = requestId
      ? `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`
      : `${API_BASE}/publicRequests/latest`;

    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!data || !data.request || !Array.isArray(data.companies)) {
        throw new Error("Invalid response structure");
      }

      const request = data.request;
      const companies = data.companies;

      const sectorLabel = (request.sector || request.category || "").trim();
      const cityLabel = (request.city || "").trim();

      subtitleEl.textContent =
        sectorLabel && cityLabel
          ? `Gebaseerd op jouw aanvraag voor ${sectorLabel} in ${cityLabel}.`
          : "";

      // 1️⃣ Exacte match
      let results = filterBySectorAndCity(companies, request, true);

      // 2️⃣ Fallback: andere plaatsen binnen dezelfde sector
      if (results.length === 0) {
        results = filterBySectorAndCity(companies, request, false);

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
        clearState();
      }

      renderCompanies(results);
      footerEl.classList.remove("hidden");
      updateFooter();

    } catch (err) {
      console.error("RESULTS INIT ERROR:", err);
      showNoRequest();
    }
  }

  // =====================
  // Filtering
  // =====================
  function filterBySectorAndCity(companies, request, exactCity) {
    const requestSector = normalizeText(request.sector || request.category || "");
    const requestCity = normalizeText(request.city || "");

    if (!requestSector) return [];

    const sectorKey = findSectorKey(requestSector);
    const allowed = sectorKey ? new Set(SECTOR_MAP[sectorKey]) : null;

    return companies
      .filter(c => {
        const tokens = getCompanyTokens(c);
        return allowed ? tokens.some(t => allowed.has(t)) : false;
      })
      .filter(c => {
        if (!exactCity) return true;
        return normalizeText(c.city || "") === requestCity;
      })
      .sort((a, b) => {
        const ar = Number(a.googleRating) || 0;
        const br = Number(b.googleRating) || 0;
        return br - ar;
      });
  }

  function findSectorKey(value) {
    for (const key of Object.keys(SECTOR_MAP)) {
      if (SECTOR_MAP[key].includes(value)) return key;
    }
    return null;
  }

  function getCompanyTokens(company) {
    const tokens = [];
    addTokens(tokens, company.sector);
    addTokens(tokens, company.category);
    return Array.from(new Set(tokens)).filter(Boolean);
  }

  function addTokens(out, value) {
    if (Array.isArray(value)) {
      value.forEach(v => addTokens(out, v));
      return;
    }
    const s = normalizeText(value);
    if (!s) return;

    s.split(/[,/|•·–-]+/g)
      .map(p => p.trim())
      .filter(Boolean)
      .forEach(p => out.push(p));
  }

  function normalizeText(v) {
    return String(v || "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  // =====================
  // Render
  // =====================
  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach(c => {
      const card = document.createElement("div");
      card.className = "company-card";
      card.innerHTML = `
        <label>
          <input type="checkbox" />
          <strong>${escapeHtml(c.name || "")}</strong><br/>
          <span class="muted">${escapeHtml(c.city || "")}</span>
        </label>
      `;

      const checkbox = card.querySelector("input");
      checkbox.addEventListener("change", () => toggleSelect(c._id, checkbox));
      listEl.appendChild(card);
    });
  }

  function toggleSelect(id, checkbox) {
    if (!id) return;

    if (checkbox.checked) {
      if (selected.size >= 5) {
        checkbox.checked = false;
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

  // =====================
  // States
  // =====================
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
      <p>Je bent op deze pagina gekomen zonder actieve aanvraag.</p>
      <p><a href="/request.html" class="btn-primary">Start een nieuwe aanvraag</a></p>
    `;
    footerEl.classList.add("hidden");
  }

  function clearState() {
    stateEl.textContent = "";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
