// frontend/js/results.js
// v2026-01-13b — syntax-safe, matches premium results.html

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com/api/publicRequests";

  // URL
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  // DOM (exacte IDs uit results.html)
  const cityInput = document.getElementById("cityInput");
  const applyCityBtn = document.getElementById("applyCityBtn");

  const selectionCounter = document.getElementById("selectionCounter");
  const selectionHint = document.getElementById("selectionHint");
  const resultsStatus = document.getElementById("resultsStatus");

  const startCompanyBox = document.getElementById("startCompanyBox");
  const companiesList = document.getElementById("companiesList");

  const submitSelectionBtn = document.getElementById("submitSelectionBtn");

  // Harde DOM-check
  const required = [
    cityInput,
    applyCityBtn,
    selectionCounter,
    selectionHint,
    resultsStatus,
    startCompanyBox,
    companiesList,
    submitSelectionBtn
  ];

  if (required.some(el => !el)) {
    console.error("results.js: ontbrekende DOM-elementen");
    return;
  }

  if (!requestId) {
    resultsStatus.textContent = "Geen aanvraag-ID gevonden.";
    submitSelectionBtn.disabled = true;
    return;
  }

  // State
  let allCompanies = [];
  let visibleCompanies = [];
  const selectedIds = new Set();
  let startCompanyId = null;

  // Helpers
  const norm = v => (v || "").toString().trim().toLowerCase();

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function updateCounter() {
    selectionCounter.textContent = `${selectedIds.size} van 5 geselecteerd`;
    submitSelectionBtn.disabled = selectedIds.size === 0;
  }

  function setStatus(text) {
    resultsStatus.textContent = text || "";
  }

  function setHint(text) {
    selectionHint.textContent = text || "";
  }

  function renderStartCompany(request) {
    startCompanyBox.classList.add("hidden");
    startCompanyBox.innerHTML = "";
    startCompanyId = null;

    if (!request || !request.company || !request.company._id) return;

    const c = request.company;
    startCompanyId = String(c._id);

    startCompanyBox.classList.remove("hidden");
    startCompanyBox.innerHTML =
      `<div class="text-xs font-semibold text-slate-700 uppercase mb-2">Je doet een aanvraag bij</div>` +
      `<div class="font-semibold text-slate-900">${escapeHtml(c.name)}</div>` +
      (c.city
        ? `<div class="text-xs text-slate-500 mt-1">${escapeHtml(c.city)}</div>`
        : "") +
      `<div class="text-[11px] text-slate-500 mt-2">Dit bedrijf staat bovenaan. Je kunt daarnaast tot 4 andere bedrijven kiezen.</div>`;
  }

  function companyCard(company) {
    const id = String(company._id);

    const wrapper = document.createElement("div");
    wrapper.className = "glass-card p-4 flex gap-3 items-start";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedIds.has(id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (selectedIds.size >= 5) {
          checkbox.checked = false;
          setHint("Je kunt maximaal 5 bedrijven selecteren.");
          return;
        }
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      setHint("");
      updateCounter();
    });

    const info = document.createElement("div");
    info.innerHTML =
      `<div class="font-semibold text-slate-900">${escapeHtml(company.name)}</div>` +
      (company.city
        ? `<div class="text-xs text-slate-500 mt-1">${escapeHtml(company.city)}</div>`
        : "");

    wrapper.appendChild(checkbox);
    wrapper.appendChild(info);
    return wrapper;
  }

  function renderList() {
    companiesList.innerHTML = "";

    if (visibleCompanies.length === 0) {
      setStatus("Geen bedrijven beschikbaar voor deze aanvraag.");
      return;
    }

    let list = [...visibleCompanies];
    if (startCompanyId) {
      const idx = list.findIndex(c => String(c._id) === startCompanyId);
      if (idx > 0) {
        const [sc] = list.splice(idx, 1);
        list.unshift(sc);
      }
    }

    list.forEach(c => companiesList.appendChild(companyCard(c)));
    setStatus("");
  }

  function applyCityFilter() {
    const q = norm(cityInput.value);

    if (!q) {
      visibleCompanies = [...allCompanies];
      setHint("");
      renderList();
      return;
    }

    const matched = allCompanies.filter(c =>
      `${norm(c.city)} ${norm(c.postcode)} ${norm(c.place)}`.includes(q)
    );

    if (matched.length === 0) {
      visibleCompanies = [...allCompanies];
      setHint("Geen exacte match op plaats. We tonen alle beschikbare bedrijven.");
    } else {
      visibleCompanies = matched;
      setHint(`Gefilterd op: ${cityInput.value}`);
    }

    renderList();
  }

  // Events
  applyCityBtn.addEventListener("click", e => {
    e.preventDefault();
    applyCityFilter();
  });

  submitSelectionBtn.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;

    submitSelectionBtn.disabled = true;
    submitSelectionBtn.textContent = "Bezig…";

    try {
      const res = await fetch(`${API_BASE}/${requestId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: Array.from(selectedIds).slice(0, 5) })
      });

      if (!res.ok) throw new Error("Send failed");
      window.location.href = `/success.html?requestId=${requestId}`;
    } catch (err) {
      console.error(err);
      submitSelectionBtn.disabled = false;
      submitSelectionBtn.textContent = "Aanvraag versturen naar geselecteerde bedrijven";
      setHint("Versturen mislukt. Probeer het opnieuw.");
    }
  });

  // Init
  (async function init() {
    try {
      setStatus("Bedrijven worden geladen…");

      const res = await fetch(`${API_BASE}/${requestId}`);
      const data = await res.json();

      renderStartCompany(data.request);

      allCompanies = Array.isArray(data.companies) ? data.companies : [];
      visibleCompanies = [...allCompanies];

      if (Array.isArray(data.request?.companyIds)) {
        data.request.companyIds.forEach(id => selectedIds.add(String(id)));
      }

      updateCounter();
      renderList();
    } catch (err) {
      console.error(err);
      setStatus("Kon bedrijven niet laden.");
    }
  })();

})();
