// frontend/js/results.js
// DEFINITIEVE, FOUTLOZE VERSIE

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

      const sector = request.sector || request.category || "";
      const city = request.city || "";

      subtitleEl.textContent =
        sector && city
          ? `Gebaseerd op jouw aanvraag voor ${sector} in ${city}.`
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
  // Filtering
  // =====================
  function filterCompanies(companies, request) {
    const sector = (request.sector || request.category || "").toLowerCase();
    const city = (request.city || "").toLowerCase();

    return companies
      .filter(c => {
        const cSector = (c.sector || "").toLowerCase();
        const cCategory = (c.category || "").toLowerCase();

        return (
          cSector.includes(sector) ||
          sector.includes(cSector) ||
          cCategory.includes(sector) ||
          sector.includes(cCategory)
        );
      })
      .filter(c => {
        return !city || (c.city || "").toLowerCase() === city;
      })
      .sort((a, b) => {
        const ar = Number(a.googleRating) || 0;
        const br = Number(b.googleRating) || 0;
        return br - ar;
      });
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
