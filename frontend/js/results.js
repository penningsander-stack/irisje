// frontend/js/results.js
/* v2026-01-13 STARTCOMPANY-ID-MATCH */

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";
  const qs = (s, r = document) => r.querySelector(s);

  const state = {
    requestId: null,
    request: null,
    companies: [],
    selectedIds: new Set()
  };

  function getRequestId() {
    return new URLSearchParams(window.location.search).get("requestId");
  }

  function updateCounter() {
    const el = qs("#selectedCount");
    if (el) el.textContent = `${state.selectedIds.size} geselecteerd`;
  }

  function renderMessage(text = "") {
    const el = qs("#resultsMessage");
    if (!el) return;
    el.style.display = text ? "" : "none";
    el.textContent = text;
  }

  function renderCompany(company, selected = false) {
    const id = company._id;
    const card = document.createElement("div");
    card.className = "glass-card p-4 flex flex-col";

    card.innerHTML = `
      <strong class="text-sm mb-1">${company.name}</strong>
      <span class="text-xs text-slate-500 mb-2">${company.city || ""}</span>
      <span class="text-xs text-slate-500 mb-3">Score: ${company.score ?? 0}</span>
      <div class="mt-auto flex gap-2">
        <button class="btn-primary select-btn">
          ${selected ? "Geselecteerd" : "Selecteer"}
        </button>
        <a href="company.html?slug=${company.slug}" class="btn-secondary">Bekijk</a>
      </div>
    `;

    const btn = card.querySelector(".select-btn");

    if (selected) {
      state.selectedIds.add(id);
    }

    btn.addEventListener("click", () => {
      if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
        btn.textContent = "Selecteer";
      } else {
        if (state.selectedIds.size >= 5) return;
        state.selectedIds.add(id);
        btn.textContent = "Geselecteerd";
      }
      updateCounter();
    });

    return card;
  }

  async function init() {
    state.requestId = getRequestId();
    if (!state.requestId) {
      renderMessage("Aanvraag niet gevonden.");
      return;
    }

    renderMessage("Bedrijven laden…");

    const res = await fetch(`${API_BASE}/api/publicRequests/${state.requestId}`);
    const data = await res.json();

    state.request = data.request;
    state.companies = data.companies || [];

    const startCompanyId = state.request.companyId;

    const startCompany = state.companies.find(c => c._id === startCompanyId);
    const otherCompanies = state.companies.filter(c => c._id !== startCompanyId);

    // STARTBEDRIJF
    const startBox = qs("#startCompanyBox");
    if (startCompany && startBox) {
      startBox.classList.remove("hidden");
      startBox.innerHTML = "";
      startBox.appendChild(renderCompany(startCompany, true));
    }

    // OVERIGE BEDRIJVEN
    const list = qs("#companiesList");
    list.innerHTML = "";
    otherCompanies.forEach(c => list.appendChild(renderCompany(c)));

    updateCounter();
    renderMessage("");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
