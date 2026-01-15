// frontend/js/results.js
// Resultatenpagina – correcte sector + Google reviews + top-5 + profiel-links

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

    // ✔️ JUISTE VELDEN
    subtitleEl.textContent =
      `Gebaseerd op jouw aanvraag voor ${request.sector} in ${request.city}.`;

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

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      if (index < 5) {
        card.classList.add("is-top-match");
      }

      const ratingHtml = renderRating(company);
      const badgeHtml =
        index < 5
          ? `<span class="top-match-badge">Beste match</span>`
          : "";

      const slug = encodeURIComponent(company.slug || "");

      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox" class="company-checkbox" />
          <div class="company-info">
            <div class="company-header">
              <h3>
                <a
                  href="/company.html?slug=${slug}"
                  target="_blank"
                  rel="noopener"
                  class="company-link"
                >
                  ${escapeHtml(company.name)}
                </a>
              </h3>
              ${badgeHtml}
            </div>

            ${ratingHtml}

            <div class="company-city">${escapeHtml(company.city)}</div>

            <div class="company-actions">
              <a
                href="/company.html?slug=${slug}"
                target="_blank"
                rel="noopener"
                class="company-profile-link"
              >
                Bekijk profiel
              </a>
            </div>
          </div>
        </label>
      `;

      const checkbox = card.querySelector(".company-checkbox");

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
    const avg = Number(company?.avgRating);
    const cnt = Number(company?.reviewCount);

    if (!Number.isFinite(avg) || !Number.isFinite(cnt) || cnt <= 0) {
      return `<div class="muted">Nog geen Google-reviews</div>`;
    }

    return `
      <div class="company-rating">
        ⭐ ${avg.toFixed(1)}
        <span class="muted">(${cnt} Google-reviews)</span>
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
