// frontend/js/results.js
// Resultatenpagina – toont bedrijven + Google-review samenvatting

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const subtitleEl = document.getElementById("resultsSubtitle");

  if (!requestId) {
    showState("Ongeldige aanvraag.");
    return;
  }

  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    const companies = data.companies || [];
    const request = data.request || {};

    subtitleEl.textContent =
      `Gebaseerd op jouw aanvraag voor ${request.category} in ${request.city}.`;

    if (!companies.length) {
      showState("Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.");
      return;
    }

    renderCompanies(companies);
    footerEl.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    showState("Resultaten konden niet worden geladen.");
  }

  function showState(text) {
    stateEl.textContent = text;
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";
    let selected = 0;

    companies.forEach(company => {
      const card = document.createElement("div");
      card.className = "result-card";

      const ratingHtml = renderRating(company);

      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox" class="company-checkbox" />
          <div class="company-info">
            <h3>${escapeHtml(company.name)}</h3>
            ${ratingHtml}
            <div class="company-city">${escapeHtml(company.city)}</div>
          </div>
        </label>
      `;

      const checkbox = card.querySelector("input[type=checkbox]");
      checkbox.addEventListener("change", () => {
        selected += checkbox.checked ? 1 : -1;
        if (selected > 5) {
          checkbox.checked = false;
          selected--;
          return;
        }
        countEl.textContent = `${selected} van 5 geselecteerd`;
        sendBtn.disabled = selected === 0;
      });

      listEl.appendChild(card);
    });
  }

  function renderRating(company) {
    if (!company.avgRating || !company.reviewCount) {
      return `<div class="muted">Nog geen Google-reviews</div>`;
    }

    return `
      <div class="company-rating">
        ⭐ ${Number(company.avgRating).toFixed(1)}
        <span class="muted">(${company.reviewCount} Google-reviews)</span>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[s]);
  }
});
