// frontend/js/results.js
// Resultatenpagina (stabiel): laad op basis van requestId (primair) en fallback naar /latest (secundair).
// Inclusief sector-normalisatie (Optie A): synoniemen mappen naar één canonieke sector-key.

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const footerEl = document.getElementById("resultsFooter");

  // Sector-normalisatie (uitbreidbaar)
  const SECTOR_MAP = {
    advocaat: ["advocaat", "advocatuur", "juridisch", "law", "lawyer", "lawyers", "legal", "advocaten"],
    hovenier: ["hovenier", "tuin", "tuinen", "tuinonderhoud", "tuinaanleg", "groen", "groenvoorziening", "tuinier"],
    loodgieter: ["loodgieter", "installateur", "installatie", "sanitair", "cv", "verwarming", "riolering", "lekkage"],
    elektricien: ["elektricien", "elektra", "elektrisch", "installatietechniek", "stroom", "groepenkast"]
  };

  const selected = new Set();

  if (!listEl || !stateEl || !subtitleEl || !countEl || !sendBtn || !footerEl) {
    // Als IDs in HTML niet bestaan, kunnen we niet renderen.
    // We loggen dit één keer, zonder de pagina te laten crashen.
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.request || !Array.isArray(data.companies)) {
        throw new Error("Invalid response structure");
      }

      const request = data.request;
      const companies = data.companies;

      const sectorLabel = (request.sector || request.category || "").toString().trim();
      const cityLabel = (request.city || "").toString().trim();

      subtitleEl.textContent =
        sectorLabel && cityLabel
          ? `Gebaseerd op jouw aanvraag voor ${sectorLabel} in ${cityLabel}.`
          : "";

      const relevant = filterCompanies(companies, request);

      if (relevant.length === 0) {
        showEmpty();
        return;
      }

      renderCompanies(relevant);
      clearState();
      footerEl.classList.remove("hidden");
      updateFooter();
    } catch (err) {
      console.error("RESULTS INIT ERROR:", err);
      showNoRequest();
    }
  }

  // =====================
  // Filtering (met sector-normalisatie)
  // =====================
  function filterCompanies(companies, request) {
    const requestSectorRaw = normalizeText(request.sector || request.category || "");
    const requestCity = normalizeText(request.city || "");

    if (!requestSectorRaw) return [];

    const requestKey = findSectorKey(requestSectorRaw);
    const allowed = requestKey ? new Set(SECTOR_MAP[requestKey]) : null;

    // Als de aanvraagsector onbekend is, vallen we terug op strikte match van label (veilig, voorspelbaar)
    const requestFallbackLabel = requestSectorRaw;

    const filtered = companies
      .filter(c => {
        const tokens = getCompanyTokens(c);

        if (allowed) {
          // Match op sector-groep
          return tokens.some(t => allowed.has(t));
        }

        // Fallback: strikte label-match (geen fuzzy)
        return tokens.some(t => t === requestFallbackLabel);
      })
      .filter(c => {
        if (!requestCity) return true;
        return normalizeText(c.city || "") === requestCity;
      })
      .sort((a, b) => {
        const ar = Number(a.googleRating) || 0;
        const br = Number(b.googleRating) || 0;
        return br - ar;
      });

    return filtered;
  }

  function findSectorKey(value) {
    // Exact token match binnen de map (geen includes) om ruis te voorkomen
    for (const key of Object.keys(SECTOR_MAP)) {
      if (SECTOR_MAP[key].includes(value)) return key;
    }
    return null;
  }

  function getCompanyTokens(company) {
    const tokens = [];

    const sector = company && company.sector != null ? company.sector : "";
    const category = company && company.category != null ? company.category : "";

    // sector/category kunnen string of array zijn
    addTokens(tokens, sector);
    addTokens(tokens, category);

    // Dedup + filter lege
    return Array.from(new Set(tokens)).filter(Boolean);
  }

  function addTokens(out, value) {
    if (Array.isArray(value)) {
      value.forEach(v => addTokens(out, v));
      return;
    }

    const s = normalizeText(value);
    if (!s) return;

    // Split op veelvoorkomende scheidingstekens (komma, slash, bullets)
    const parts = s
      .split(/[,/|•·–-]+/g)
      .map(p => p.trim())
      .filter(Boolean);

    parts.forEach(p => out.push(p));
  }

  function normalizeText(v) {
    return String(v || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
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
      <p>
        <a href="/request.html" class="btn-primary">
          Start een nieuwe aanvraag
        </a>
      </p>
    `;
    footerEl.classList.add("hidden");
  }

  function clearState() {
    stateEl.textContent = "";
  }

  // =====================
  // Utils
  // =====================
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
