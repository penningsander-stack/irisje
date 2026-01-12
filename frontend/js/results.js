// frontend/js/results.js
// v2026-01-12 — plaats/postcode toevoegen vóór selectie (flow veilig)

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
  const submitBtn = document.getElementById("submitSelectionBtn");
  const startCompanyBox = document.getElementById("startCompanyBox");

  let allCompanies = [];
  let selectedIds = new Set();
  let startCompanyId = null;
  let appliedCity = "";

  init();

  async function init() {
    await loadRequestAndCompanies();
    renderCompanies();
    updateCounter();
  }

  async function loadRequestAndCompanies() {
    const res = await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);
    const data = await res.json();

    if (!res.ok || !data || !data.request) return;

    const req = data.request;
    allCompanies = data.companies || [];

    if (req.company) {
      startCompanyId = req.company._id;
      selectedIds.add(startCompanyId);
      renderStartCompany(req.company);
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

      const card = document.createElement("div");
      card.className = "company-card";

      const checked = selectedIds.has(c._id);

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold text-sm">${c.name}</div>
            <div class="text-xs text-slate-500">${c.city || ""}</div>
          </div>
          <input type="checkbox" ${checked ? "checked" : ""} />
        </div>
      `;

      const checkbox = card.querySelector("input");
      checkbox.addEventListener("change", () => toggleSelect(c._id, checkbox.checked));

      companiesList.appendChild(card);
    });
  }

  function toggleSelect(id, checked) {
    if (checked) {
      if (selectedIds.size >= 5) return;
      selectedIds.add(id);
    } else {
      selectedIds.delete(id);
    }
    updateCounter();
    renderCompanies();
  }

  function updateCounter() {
    selectionCounter.textContent = `${selectedIds.size} van 5 geselecteerd`;
    submitBtn.disabled = selectedIds.size === 0;
  }

  applyCityBtn.addEventListener("click", () => {
    appliedCity = (cityInput.value || "").trim().toLowerCase();
    cityHint.textContent = appliedCity
      ? `Gefilterd op: ${cityInput.value}`
      : "Dit helpt om bedrijven in jouw regio te tonen.";
    renderCompanies();
  });

  submitBtn.addEventListener("click", async () => {
    await fetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}/send`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    companyIds: Array.from(selectedIds),
    city: appliedCity || "Onbekend"
  }),
});


    window.location.href = "/success.html";
  });
})();
