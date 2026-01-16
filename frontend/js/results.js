// frontend/js/results.js
// Resultatenpagina – stabiele selectie + verzendvoorbereiding

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const subtitleEl = document.getElementById("resultsSubtitle");

  if (!stateEl || !listEl) {
    console.error("results.js: verplichte elementen ontbreken");
    return;
  }

  if (!requestId) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const request = data.request || {};

    if (subtitleEl) {
      subtitleEl.textContent =
        `Gebaseerd op jouw aanvraag voor ${request.sector || ""} in ${request.city || ""}.`;
    }

    if (!companies.length) {
      stateEl.textContent =
        "Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.";
      return;
    }

    stateEl.textContent = "";
    renderCompanies(companies);

    if (footerEl) footerEl.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";
    updateSelectionUI();

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const slug = encodeURIComponent(company?.slug || "");
      const badge =
        index < 5 ? `<span class="top-match-badge">Beste match</span>` : "";

      const companyId = company?._id ? String(company._id) : "";

      card.innerHTML = `
        <label class="company-select">
          <input
            type="checkbox"
            class="company-checkbox"
            ${companyId ? `data-company-id="${escapeHtml(companyId)}"` : ""}
          />
          <div class="company-info">
            <div class="company-header">
              <h3>
                <a href="/company.html?slug=${slug}" target="_blank" rel="noopener">
                  ${escapeHtml(company?.name)}
                </a>
              </h3>
              ${badge}
            </div>
            <div class="company-city">${escapeHtml(company?.city)}</div>
          </div>
        </label>
      `;

      const checkbox = card.querySelector(".company-checkbox");

      checkbox.addEventListener("change", () => {
        const checked = document.querySelectorAll(".company-checkbox:checked");
        if (checked.length > 5) {
          checkbox.checked = false;
          return;
        }
        updateSelectionUI();
      });

      listEl.appendChild(card);
    });
  }

  function updateSelectionUI() {
    const selected = document.querySelectorAll(".company-checkbox:checked").length;
    if (countEl) countEl.textContent = `${selected} van 5 geselecteerd`;
    if (sendBtn) sendBtn.disabled = selected === 0;
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


// === DEFINITIEVE CLICK-HANDLER (werkt altijd) ===
document.addEventListener("click", function (e) {
  const btn = e.target.closest("#stickySubmitBtn");
  if (!btn) return;

  console.log("STICKY SUBMIT CLICK GEDTECTEERD");

  const selectedCheckboxes =
    document.querySelectorAll(".company-checkbox:checked");

  if (!selectedCheckboxes.length) {
    alert("Selecteer minimaal één bedrijf.");
    return;
  }

  const companyIds = Array.from(selectedCheckboxes)
    .map(cb => cb.dataset.companyId)
    .filter(Boolean);

  console.log("Geselecteerde bedrijven:", companyIds);
});
