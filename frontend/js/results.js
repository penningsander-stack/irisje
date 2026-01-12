// frontend/js/results.js
// v2026-01-13b — FIX: cards zichtbaar (result-card) + robuuste fetch + veilige submit

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const cityInput = document.getElementById("cityInput");
  const applyCityBtn = document.getElementById("applyCityBtn");
  const cityHint = document.getElementById("cityHint");

  const companiesList = document.getElementById("companiesList");
  const selectionCounter = document.getElementById("selectionCounter");
  const selectionHint = document.getElementById("selectionHint");
  const submitBtn = document.getElementById("submitSelectionBtn");
  const startCompanyBox = document.getElementById("startCompanyBox");
  const resultsStatus = document.getElementById("resultsStatus");

  let allCompanies = [];
  let selectedIds = new Set();
  let startCompanyId = null;
  let appliedCity = "";
  let isSending = false;

  init();

  async function init() {
    if (!requestId) {
      if (resultsStatus) resultsStatus.textContent = "Aanvraag-ID ontbreekt.";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (resultsStatus) resultsStatus.textContent = "Bedrijven worden geladen…";
    await loadRequestAndCompanies();
    renderCompanies();
    updateCounter();
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch (_) {
      return null;
    }
  }

  async function loadRequestAndCompanies() {
    try {
      const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
      const data = await safeJson(res);

      if (!res.ok || !data || !data.request) {
        if (resultsStatus) resultsStatus.textContent = "Aanvraag niet gevonden.";
        allCompanies = [];
        return;
      }

      allCompanies = Array.isArray(data.companies) ? data.companies : [];

      if (resultsStatus) {
        resultsStatus.textContent = allCompanies.length
          ? ""
          : "Geen bedrijven gevonden voor deze aanvraag.";
      }

      if (data.request.company && data.request.company._id) {
        startCompanyId = data.request.company._id;
        selectedIds.add(startCompanyId);
        renderStartCompany(data.request.company);
      }
    } catch (e) {
      if (resultsStatus) resultsStatus.textContent = "Er ging iets mis bij het laden van de bedrijven.";
      allCompanies = [];
    }
  }

  function renderStartCompany(company) {
    if (!startCompanyBox) return;
    startCompanyBox.classList.remove("hidden");
    startCompanyBox.innerHTML = `
      <div class="text-[11px] text-slate-500 mb-1">Startbedrijf (vast geselecteerd)</div>
      <div class="font-semibold">${escapeHtml(company.name || "")}</div>
      <div class="text-xs text-slate-500">${escapeHtml(company.city || "")}</div>
    `;
  }

  function renderCompanies() {
    if (!companiesList) return;
    companiesList.innerHTML = "";

    const list = appliedCity
      ? allCompanies.filter(c => (c.city || "").toLowerCase().includes(appliedCity))
      : allCompanies;

    if (!list.length && resultsStatus) {
      // laat bestaande “Aanvraag niet gevonden.” staan, anders: geen resultaten
      if (!resultsStatus.textContent) {
        resultsStatus.textContent = appliedCity
          ? "Geen bedrijven gevonden voor dit filter."
          : "Geen bedrijven gevonden voor deze aanvraag.";
      }
    }

    list.forEach(c => {
      if (!c || !c._id) return;
      if (c._id === startCompanyId) return;

      const checked = selectedIds.has(c._id);
      const disabled = !checked && selectedIds.size >= 5;

      const card = document.createElement("div");

      // ✅ BELANGRIJKE FIX: gebruik bestaande premium styling
      card.className = "result-card";

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="result-title">${escapeHtml(c.name || "")}</div>
            <div class="result-location">${escapeHtml(c.city || "")}</div>
          </div>
          <input type="checkbox" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}/>
        </div>
      `;

      const checkbox = card.querySelector("input");
      checkbox.addEventListener("change", e => toggleSelect(c._id, e.target.checked));

      companiesList.appendChild(card);
    });
  }

  function toggleSelect(id, checked) {
    if (checked && selectedIds.size >= 5) return;
    checked ? selectedIds.add(id) : selectedIds.delete(id);
    updateCounter();
    renderCompanies();
  }

  function updateCounter() {
    if (selectionCounter) selectionCounter.textContent = `${selectedIds.size} van 5 geselecteerd`;

    if (selectionHint) {
      selectionHint.textContent =
        selectedIds.size >= 5
          ? "Maximum bereikt"
          : `Je kunt nog ${5 - selectedIds.size} kiezen`;
    }

    if (submitBtn) submitBtn.disabled = selectedIds.size === 0 || isSending;
  }

  if (applyCityBtn) {
    applyCityBtn.addEventListener("click", () => {
      appliedCity = (cityInput?.value || "").trim().toLowerCase();

      if (cityHint) {
        cityHint.textContent = appliedCity
          ? `Gefilterd op: ${cityInput.value}`
          : "Gebruik dit om bedrijven in jouw regio te tonen.";
      }

      if (resultsStatus) resultsStatus.textContent = "";
      renderCompanies();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      if (!requestId) return;
      if (selectedIds.size === 0) return;
      if (isSending) return;

      isSending = true;
      submitBtn.disabled = true;

      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Aanvraag wordt verstuurd…";

      try {
        const res = await fetch(
          `${API_BASE}/publicRequests/${encodeURIComponent(requestId)}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyIds: Array.from(selectedIds),
              city: appliedCity || "Onbekend"
            })
          }
        );

        if (!res.ok) throw new Error("send failed");
        window.location.href = "/success.html";
      } catch (e) {
        isSending = false;
        submitBtn.disabled = false;
        submitBtn.textContent = originalText || "Aanvraag versturen naar geselecteerde bedrijven";
        alert("Versturen mislukt. Probeer het opnieuw.");
        updateCounter();
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
