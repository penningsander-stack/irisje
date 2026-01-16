// frontend/js/results.js
// Stap 3: selectie verzenden naar backend (definitief, opgeschoond)

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
    updateSelectionUI();

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      if (index < 5) card.classList.add("is-top-match");

      const slug = encodeURIComponent(company.slug || "");

      card.innerHTML = `
        <label class="company-select">
          <input
            type="checkbox"
            class="company-checkbox"
            data-company-id="${company._id}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3>
                <a href="/company.html?slug=${slug}" target="_blank" rel="noopener">
                  ${escapeHtml(company.name)}
                </a>
              </h3>
              ${index < 5 ? `<span class="top-match-badge">Beste match</span>` : ""}
            </div>

            ${renderRating(company)}

            <div class="company-city">${escapeHtml(company.city)}</div>
          </div>
        </label>
      `;

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

  // === SELECTIE LOGICA ===
  function updateSelectionUI() {
    const selected = document.querySelectorAll(".company-checkbox:checked").length;
    countEl.textContent = `${selected} van 5 geselecteerd`;
    sendBtn.disabled = selected === 0;
  }

  document.addEventListener("change", e => {
    if (e.target.classList.contains("company-checkbox")) {
      const checked = document.querySelectorAll(".company-checkbox:checked");
      if (checked.length > 5) {
        e.target.checked = false;
        return;
      }
      updateSelectionUI();
    }
  });

  // === DEFINITIEVE SUBMIT (STAP 3) ===
  sendBtn.addEventListener("click", async () => {
    const selectedCheckboxes =
      document.querySelectorAll(".company-checkbox:checked");

    if (selectedCheckboxes.length === 0) return;

    const companyIds = Array.from(selectedCheckboxes)
      .map(cb => cb.dataset.companyId)
      .filter(Boolean);

    console.log("STAP 3 – VERZENDEN", { requestId, companyIds });

    try {
      const res = await fetch(
        `https://irisje-backend.onrender.com/api/publicRequests/${requestId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyIds })
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.status);
      }

      // Succes → eenvoudige bevestiging (volgende UX-stap komt later)
      alert("Aanvraag succesvol verstuurd naar geselecteerde bedrijven.");
      sendBtn.disabled = true;
    } catch (err) {
      console.error("VERZENDEN MISLUKT", err);
      alert("Verzenden mislukt. Probeer het opnieuw.");
    }
  });
});
