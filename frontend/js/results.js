// frontend/js/results.js
// v2026-01-13 — UX polish + veilige submit

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return;

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

  init();

  async function init() {
    resultsStatus.textContent = "Bedrijven worden geladen…";
    await loadRequestAndCompanies();
    renderCompanies();
    updateCounter();
  }

  async function loadRequestAndCompanies() {
    try {
      const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
      const data = await res.json();

      if (!res.ok || !data?.request) {
        resultsStatus.textContent = "Aanvraag niet gevonden.";
        return;
      }

      allCompanies = data.companies || [];
      resultsStatus.textContent = allCompanies.length
        ? ""
        : "Geen bedrijven gevonden voor deze aanvraag.";

      if (data.request.company) {
        startCompanyId = data.request.company._id;
        selectedIds.add(startCompanyId);
        renderStartCompany(data.request.company);
      }
    } catch (e) {
      resultsStatus.textContent = "Er ging iets mis bij het laden van de bedrijven.";
    }
  }

  function renderStartCompany(company) {
    startCompanyBox.classList.remove("hidden");
    startCompanyBox.innerHTML = `
      <div class="text-[11px] text-slate-500 mb-1">Startbedrijf (vast geselecteerd)</div>
      <div class="font-semibold">${company.name}</div>
      <div class="text-xs text-slate-500">${company.city || ""}</div>
    `;
  }

  function renderCompanies() {
    companiesList.innerHTML = "";

    const list = appliedCity
      ? allCompanies.filter(c => (c.city || "").toLowerCase().includes(appliedCity))
      : allCompanies;

    list.forEach(c => {
      if (c._id === startCompanyId) return;

      const checked = selectedIds.has(c._id);
      const disabled = !checked && selectedIds.size >= 5;

      const card = document.createElement("div");
      card.className = "company-card";

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold text-sm">${c.name}</div>
            <div class="text-xs text-slate-500">${c.city || ""}</div>
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
    submitBtn.disabled = selectedIds.size === 0;
  }

  applyCityBtn.addEventListener("click", () => {
    appliedCity = cityInput.value.trim().toLowerCase();
    cityHint.textContent = appliedCity
      ? `Gefilterd op: ${cityInput.value}`
      : "Gebruik dit om bedrijven in jouw regio te tonen.";
    renderCompanies();
  });

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Aanvraag wordt verstuurd…";

    try {
      const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyIds: Array.from(selectedIds),
          city: appliedCity || "Onbekend"
        })
      });

      if (!res.ok) throw new Error("Send failed");

      window.location.href = "/success.html";
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Aanvraag versturen naar geselecteerde bedrijven";
      alert("Versturen mislukt. Probeer het opnieuw.");
    }
  });
})();
