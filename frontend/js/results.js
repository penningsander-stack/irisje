// frontend/js/results.js
// Resultatenpagina – bedrijven tonen + selectie + doorsturen (Optie A, hersteld)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const countEl = document.getElementById("selectedCount");
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
    updateSelectionUI();

  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const companyId = company?._id ? String(company._id) : "";
      const badge =
        index < 5
          ? `<span class="top-match-badge">Beste match</span>`
          : "";

      const rating =
        company?.avgRating && company?.reviewCount
          ? `
            <div class="company-rating">
              ⭐ ${company.avgRating.toFixed(1)}
              <span class="muted">(${company.reviewCount} reviews)</span>
            </div>
          `
          : "";

      card.innerHTML = `
        <label class="company-select">
          <input
            type="checkbox"
            class="company-checkbox"
            data-company-id="${escapeHtml(companyId)}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3>${escapeHtml(company?.name)}</h3>
              ${badge}
            </div>
            <div class="company-city">${escapeHtml(company?.city)}</div>
            ${rating}
          </div>
        </label>
      `;

      const checkbox = card.querySelector(".company-checkbox");

      checkbox.addEventListener("change", () => {
        const checked =
          document.querySelectorAll(".company-checkbox:checked");
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
    const selected =
      document.querySelectorAll(".company-checkbox:checked").length;
    if (countEl) {
      countEl.textContent = `${selected} van 5 geselecteerd`;
    }
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

// === LEIDENDE SUBMITKNOP ===
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#stickySubmitBtn");
  if (!btn) return;

  const selected = Array.from(
    document.querySelectorAll(".company-checkbox:checked")
  )
    .map(cb => cb.dataset.companyId)
    .filter(Boolean);

  if (!selected.length) {
    alert("Selecteer minimaal één bedrijf.");
    return;
  }

  sessionStorage.setItem(
    "selectedCompanyIds",
    JSON.stringify(selected)
  );

  window.location.href = "/request-send.html";
});
