// frontend/js/results.js
(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const listEl = document.getElementById("companiesList");
  const stateEl = document.getElementById("resultsState");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");

  const selected = new Set();
  let requestData = null;

  init();

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get("requestId");

    if (!requestId) {
      return showError("Aanvraag niet gevonden.");
    }

    showLoading();

    try {
      const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
      if (!res.ok) throw new Error("load_failed");
      const data = await res.json();

      requestData = data.request;
      subtitleEl.textContent =
        `Gebaseerd op jouw aanvraag voor ${requestData.category || requestData.sector} in ${requestData.city}.`;

      const relevant = getRelevantCompanies(
        data.companies,
        requestData
      );

      if (!relevant.length) {
        showEmpty();
        return;
      }

      renderCompanies(relevant);
      updateFooter();
      clearState();
    } catch {
      showError("Het laden van bedrijven is mislukt. Probeer het opnieuw.");
    }
  }

  function getRelevantCompanies(companies, request) {
    const category = (request.category || request.sector || "").toLowerCase();
    const city = (request.city || "").toLowerCase();

    // 1) filter op categorie
    let filtered = companies.filter(c =>
      (c.category || c.sector || "").toLowerCase() === category
    );

    // 2) filter op stad (fallback als leeg)
    const cityMatches = filtered.filter(c =>
      (c.city || "").toLowerCase() === city
    );
    if (cityMatches.length) filtered = cityMatches;

    // 3) sorteer stabiel (toekomstvast)
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
  }

  function showEmpty() {
    stateEl.innerHTML = `
      <h2>Geen geschikte bedrijven gevonden</h2>
      <p>We tonen daarom geen resultaten voor deze aanvraag.</p>
    `;
  }

  function showError(msg) {
    stateEl.textContent = msg;
  }

  function clearState() {
    stateEl.textContent = "";
  }
})();
