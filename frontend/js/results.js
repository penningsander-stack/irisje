// js/results.js
// Resultatenpagina – robuust, refresh-safe, service-worker-safe

document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const footerEl = document.getElementById("resultsFooter");

  const selected = new Set();
  let requestData = null;

  init();

  async function init() {
    showLoading();

    // 1) requestId uit URL
    const params = new URLSearchParams(window.location.search);
    let requestId = params.get("requestId");

    // 2) fallback: localStorage (gezet door request.js)
    if (!requestId) {
      try {
        requestId = localStorage.getItem("lastRequestId");
      } catch (_) {
        // ignore
      }
    }

    // 3) geen requestId → nette uitleg
    if (!requestId) {
      showNoRequest();
      return;
    }

    try {
      // Cachebust + no-store om SW/caching te vermijden
      const res = await fetch(
        `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}?t=${Date.now()}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`Load failed (${res.status})`);
      }

      const data = await res.json();
      if (!data || !data.request) {
        throw new Error("Invalid response");
      }

      requestData = data.request;

      const sector = requestData.sector || requestData.category || "";
      const city = requestData.city || "";

      subtitleEl.textContent =
        sector && city
          ? `Gebaseerd op jouw aanvraag voor ${sector} in ${city}.`
          : "";

      const companies = Array.isArray(data.companies) ? data.companies : [];
      const relevant = getRelevantCompanies(companies, requestData);

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
      showError(
        "Het laden van bedrijven is mislukt. Probeer het opnieuw of start een nieuwe aanvraag."
      );
    }
  }

  // --------------------
  // Filtering / sorteren
  // --------------------
  function getRelevantCompanies(companies, request) {
    const sector =
      (request.sector || request.category || "").toLowerCase();
    const city = (request.city || "").toLowerCase();

    let filtered = companies.filter(c =>
      (c.sector || c.category || "").toLowerCase() === sector
    );

    // Als er bedrijven in exact dezelfde plaats zijn: die voorrang
    const cityMatches = filtered.filter(c =>
      (c.city || "").toLowerCase() === city
    );
    if (cityMatches.length) filtered = cityMatches;

    // Sorteren op rating (hoog → laag)
    filtered.sort((a, b) => {
      const ar = Number(a.googleRating) || 0;
      const br = Number(b.googleRating) || 0;
      return br - ar;
    });

    return filtered;
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
      checkbox.addEventListener("change", () =>
        toggleSelect(c._id, checkbox)
      );

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
      <p>Je bent op deze pagina gekomen zonder actieve aanvraag.</p>
      <p>
        <a href="/request.html" class="btn-primary">
          Start een nieuwe aanvraag
        </a>
      </p>
    `;
    footerEl.classList.add("hidden");
  }

  function showError(msg) {
    stateEl.textContent = msg;
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
