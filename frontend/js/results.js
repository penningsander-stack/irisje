// frontend/js/results.js
// MODE A: search (category + city)
// MODE B: offer-from-company (anchor company via SLUG + max 4 similar)

document.addEventListener("DOMContentLoaded", init);

const MAX_SELECT = 5;

async function init() {
  try {
    const params = new URLSearchParams(window.location.search);

    const companySlug = params.get("companySlug");
    const category = params.get("category");
    const city = params.get("city");

    setState("Laden…");

    if (companySlug) {
      await runOfferMode(companySlug);
    } else {
      await runSearchMode(category, city);
    }

    setState("");
    enableSelectionLimit(MAX_SELECT);
    updateSelectionUI(MAX_SELECT);
  } catch (err) {
    console.error(err);
    showError("Er ging iets mis bij het laden van de resultaten.");
  }
}

/* ============================================================
   MODE B — OFFERTES VANAF SPECIFIEK BEDRIJF (SLUG)
   ============================================================ */

async function runOfferMode(companySlug) {
  // reset UI
  resetCompanies();

  // 1) haal ankerbedrijf op via SLUG
  const anchorRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies/slug/${encodeURIComponent(companySlug)}`
  );

  const anchorData = await safeJson(anchorRes);

  if (!anchorRes.ok || !anchorData?.ok || !anchorData?.company) {
    throw new Error(anchorData?.message || "Ankerbedrijf kon niet worden geladen");
  }

  const anchor = anchorData.company;

  // 2) render ankerbedrijf als eerste (Beste match)
  renderCompanies([anchor], { isAnchor: true });

  // 3) haal vergelijkbare bedrijven op
  const similarRes = await fetch(
    `https://irisje-backend.onrender.com/api/companies-similar?anchorSlug=${encodeURIComponent(anchor.slug)}`
  );

  const similarData = await safeJson(similarRes);

  if (!similarRes.ok || !similarData?.ok) {
    throw new Error(similarData?.message || "Similar-endpoint faalde");
  }

  const similars = Array.isArray(similarData.companies)
    ? similarData.companies.slice(0, 4)
    : [];

  // 4) render vergelijkbare bedrijven
  renderCompanies(similars, { isAnchor: false });
}

/* ============================================================
   MODE A — ZOEKRESULTATEN
   ============================================================ */

async function runSearchMode(category, city) {
  // reset UI
  resetCompanies();

  const url = new URL("https://irisje-backend.onrender.com/api/companies");
  if (category) url.searchParams.set("category", category);
  if (city) url.searchParams.set("city", city);

  const res = await fetch(url.toString());
  const data = await safeJson(res);

  if (!res.ok || !data?.ok || !Array.isArray(data.companies)) {
    throw new Error(data?.message || "Zoekresultaten konden niet worden geladen");
  }

  renderCompanies(data.companies, { isAnchor: false });
}

/* ============================================================
   RENDERING
   ============================================================ */

function resetCompanies() {
  const list = document.getElementById("companiesList");
  if (list) list.innerHTML = "";
  setState("");
  hideFooter();
}

function renderCompanies(companies, options = {}) {
  const container = document.getElementById("companiesList");
  if (!container) return;

  if (!Array.isArray(companies) || companies.length === 0) {
    setState("Geen geschikte bedrijven gevonden.");
    return;
  }

  companies.forEach((company) => {
    const card = document.createElement("div");

    // Gebruik generieke classes die in jouw CSS meestal bestaan; geen Tailwind-afhankelijkheid.
    card.className = "result-card";
    if (options.isAnchor) card.classList.add("best-match");

    // veilige fallback
    const name = escapeHtml(company?.name || "Onbekend bedrijf");
    const city = escapeHtml(company?.city || "");
    const id = company?._id ? String(company._id) : "";

    card.innerHTML = `
      <div class="result-card-inner">
        ${options.isAnchor ? `<div class="badge">Beste match</div>` : ""}
        <div class="result-card-main">
          <h3 class="result-title">${name}</h3>
          ${city ? `<p class="muted">${city}</p>` : ``}
        </div>

        <label class="result-select">
          <input type="checkbox" class="company-checkbox" value="${escapeHtml(id)}" />
          <span>Selecteer</span>
        </label>
      </div>
    `;

    container.appendChild(card);
  });

  showFooter();
}

/* ============================================================
   SELECTIE + FOOTER UI
   ============================================================ */

function enableSelectionLimit(max) {
  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("company-checkbox")) return;

    const checked = document.querySelectorAll(".company-checkbox:checked");

    if (checked.length > max) {
      e.target.checked = false;
      alert(`Je kunt maximaal ${max} bedrijven selecteren.`);
    }

    updateSelectionUI(max);
  });
}

function updateSelectionUI(max) {
  const checked = document.querySelectorAll(".company-checkbox:checked");
  const count = checked.length;

  const footer = document.getElementById("resultsFooter");
  const selectedCount = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");

  if (selectedCount) {
    selectedCount.textContent = `${count} van ${max} geselecteerd`;
  }

  if (footer) {
    footer.classList.toggle("hidden", false);
  }

  if (sendBtn) {
    sendBtn.disabled = count === 0;
  }
}

function showFooter() {
  const footer = document.getElementById("resultsFooter");
  if (footer) footer.classList.remove("hidden");
}

function hideFooter() {
  const footer = document.getElementById("resultsFooter");
  if (footer) footer.classList.add("hidden");

  const selectedCount = document.getElementById("selectedCount");
  if (selectedCount) selectedCount.textContent = `0 van ${MAX_SELECT} geselecteerd`;

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.disabled = true;
}

/* ============================================================
   STATE / FOUTMELDING
   ============================================================ */

function setState(message) {
  const state = document.getElementById("resultsState");
  if (!state) return;

  state.textContent = message || "";
}

function showError(message) {
  setState(message);

  const container = document.getElementById("companiesList");
  if (container) container.innerHTML = "";
  hideFooter();
}

/* ============================================================
   HELPERS
   ============================================================ */

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
