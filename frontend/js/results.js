// js/results.js
// Definitieve, robuuste versie – GEEN afhankelijkheid meer van requestId

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const footerEl = document.getElementById("resultsFooter");

  const selected = new Set();

  init();

  async function init() {
    showLoading();

    try {
      // ✅ ENIGE BRON: laatste publieke aanvraag
      const res = await fetch(
        `${API_BASE}/publicRequests/latest?t=${Date.now()}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`latest_failed_${res.status}`);
      }

      const data = await res.json();

      if (!data || !data.request) {
        throw new Error("invalid_latest_response");
      }

      const request = data.request;
      const companies = Array.isArray(data.companies) ? data.companies : [];

      const sector = request.sector || request.category || "";
      const city = request.city || "";

      subtitleEl.textContent =
        sector && city
          ? `Gebaseerd op jouw aanvraag voor ${sector} in ${city}.`
          : "";

      const relevant = getRelevantCompanies(companies, request);

      if (!relevant.length) {
        showEmpty();
        return;
      }

      renderCompanies(relevant);
      clearState();
      footerEl.classList.remove("hidden");
      updateFooter();

    } catch (err) {
      console.error(err);
      showNoRequest();
    }
  }

  // --------------------
  // Filtering / sorteren
  // --------------------
  function getRelevantCompanies(companies, request) {
  const sector = (request.sector || request.category || "").toLowerCase();
  const city = (request.city || "").toLowerCase();

  // 1️⃣ Flexibele sector-matching (maar wel inhoudelijk)
  let filtered = companies.filter(c => {
    const cSector = (c.sector || "").toLowerCase();
    const cCategory = (c.category || "").toLowerCase();

    return (
      cSector.includes(sector) ||
      sector.includes(cSector) ||
      cCategory.includes(sector) ||
      sector.includes(cCategory)
    );
  });

  // 2️⃣ Plaats-voorkeur (geen harde eis)
  const cityMatches = filtered.filter(c =>
    (c.city || "").toLowerCase() === city
  );

  if (cityMatches.length) {
    filtered = cityMatches;
  }

  // ❌ GEEN fallback naar “alles”
  // Als er geen inhoudelijke matches zijn, tonen we niets
  return filtered.sort((a, b) => {
    const ar = Number(a.googleRating) || 0;
    const br = Number(b.googleRating) || 0;
    return br - ar;
  });
}



  // --------------------
  // Render
  // --------------------
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

  // --------------------
  // States
  // --------------------
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

  // --------------------
  // Utils
  // --------------------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
