// frontend/js/results.js
// v2026-01-13d — FIX: robuuste company-bron + zichtbare results

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
      resultsStatus.textContent = "Aanvraag-ID ontbreekt.";
      submitBtn.disabled = true;
      return;
    }

    resultsStatus.textContent = "Bedrijven worden geladen…";
    await loadRequestAndCompanies();
    renderCompanies();
    updateCounter();
  }

  async function loadRequestAndCompanies() {
    try {
      const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
      const data = await res.json();

      if (!res.ok || !data || !data.request) {
        resultsStatus.textContent = "Aanvraag niet gevonden.";
        return;
      }

      // 🔴 HIER ZAT HET PROBLEEM
      allCompanies =
        data.companies ||
        data.matches ||
        data.results ||
        data.availableCompanies ||
        [];

      if (!Array.isArray(allCompanies)) allCompanies = [];

      if (data.request.company && data.request.company._id) {
        startCompanyId = data.request.company._id;
        selectedIds.add(startCompanyId);
        renderStartCompany(data.request.company);
      }

      resultsStatus.textContent = allCompanies.length
        ? ""
        : "Geen bedrijven beschikbaar voor deze aanvraag.";
    } catch (e) {
      resultsStatus.textContent = "Fout bij laden van bedrijven.";
    }
  }

  function renderStartCompany(company) {
    startCompanyBox.classList.remove("hidden");
    startCompanyBox.innerHTML = `
      <div class="text-[11px] text-slate-500 mb-1">Startbedrijf (vast geselecteerd)</div>
      <div class="font-semibold">${escapeHtml(company.name || "")}</div>
      <div class="text-xs text-slate-500">${escapeHtml(company.city || "")}</div>
    `;
  }

  function renderCompanies() {
    companiesList.innerHTML = "";

    let list = allCompanies;

    if (appliedCity) {
      const filtered = allCompanies.filter(c =>
        (c.city || "").toLowerCase().includes(appliedCity)
      );

      if (filtered.length === 0) {
        resultsStatus.textContent =
          "Geen exacte match op plaats. We tonen alle beschikbare bedrijven.";
      } else {
        list = filtered;
        resultsStatus.textContent = "";
      }
    }

    list.forEach(c => {
      if (!c || !c._id) return;
      if (c._id === startCompanyId) return;

      const checked = selectedIds.has(c._id);
      const disabled = !checked && selectedIds.size >= 5;

      const card = document.createElement("div");
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

      card.querySelector("input").addEventListener("change", e =>
        toggleSelect(c._id, e.target.checked)
      );

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
    selectionCounter.textContent = `${selectedIds.size} van 5 geselecteerd`;
    selectionHint.textContent =
      selectedIds.size >= 5
        ? "Maximum bereikt"
        : `Je kunt nog ${5 - selectedIds.size} kiezen`;
    submitBtn.disabled = selectedIds.size === 0 || isSending;
  }

  applyCityBtn.addEventListener("click", () => {
    appliedCity = cityInput.value.trim().toLowerCase();
    cityHint.textContent = appliedCity
      ? `Gefilterd op: ${cityInput.value}`
      : "Gebruik dit om bedrijven in jouw regio te tonen.";
    renderCompanies();
  });

  submitBtn.addEventListener("click", async () => {
    if (isSending || selectedIds.size === 0) return;

    isSending = true;
    submitBtn.disabled = true;
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

      if (!res.ok) throw new Error();
      window.location.href = "/success.html";
    } catch {
      isSending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "Aanvraag versturen naar geselecteerde bedrijven";
      updateCounter();
      alert("Versturen mislukt. Probeer het opnieuw.");
    }
  });

  function escapeHtml(v) {
    return String(v)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
