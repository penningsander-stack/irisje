// js/results.js
// Resultatenpagina – robuust, refresh-safe, PWA-safe

(function () {
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
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    showLoading();

    try {
      let data;

      if (requestId) {
        const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
        if (!res.ok) throw new Error("load_failed");
        data = await res.json();
      } else {
        // Fallback: geen requestId → geen resultaten mogelijk
        showError("Geen aanvraag gevonden. Start een nieuwe aanvraag.");
        return;
      }

      requestData = data.request;
      const sector =
        requestData.sector || requestData.category || "";

      subtitleEl.textContent =
        `Gebaseerd op jouw aanvraag voor ${sector} in ${requestData.city}.`;

      const relevant = getRelevantCompanies(
        data.companies || [],
        requestData
      );

      if (!relevant.length) {
        showEmpty();
        return;
      }

      renderCompanies(relevant);
      footerEl.classList.remove("hidden");
      updateFooter();
      clearState();

    } catch (err) {
      console.error(err);
      showError("Het laden van bedrijven is mislukt. Probeer het opnieuw.");
    }
  }

  function getRelevantCompanies(companies, request) {
    const sector =
      (request.sector || request.category || "").toLowerCase();
    const city = (request.city || "").toLowerCase();

    let filtered = companies.filter(c =>
      (c.sector || c.category || "").toLowerCase() === sector
    );

    const cityMatches = filtered.filter(c =>
      (c.city || "").toLowerCase() === city
    );
    if (cityMatches.length) filtered = cityMatches;

    filtered.sort((a, b) => {
      const ar = a.googleRating || 0;
      const br = b.googleRating || 0;
      return br - ar;
    });

    return filtered;
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach(c => {
      const card = document.createElement("div");
      card.className = "company-card";
      card.innerHTML = `
        <label>
          <input type="checkbox" />
          <strong>${c.name}</strong><br/>
          <span class="muted">${c.city || ""}</span>
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

  function showError(msg) {
    stateEl.textContent = msg;
    footerEl.classList.add("hidden");
  }

  function clearState() {
    stateEl.textContent = "";
  }
})();
