// frontend/js/results.js
/* v2026-01-13 STARTCOMPANY + COUNTER FIX */

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    requestId: null,
    request: null,
    allCompanies: [],
    selectedIds: new Set(),
    initialized: false
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
    if (!text) {
      el.style.display = "none";
      el.textContent = "";
    } else {
      el.style.display = "";
      el.textContent = text;
    }
  }

  function renderCompanyCard(company, { selected = false } = {}) {
    const id = company._id;
    const card = document.createElement("div");
    card.className = "glass-card p-4 flex flex-col";

    card.innerHTML = `
      <strong class="text-sm mb-1">${company.name}</strong>
      <span class="text-xs text-slate-500 mb-2">${company.city || ""}</span>
      <span class="text-xs text-slate-500 mb-3">Score: ${company.score ?? 0}</span>

      <div class="mt-auto flex gap-2">
        <button class="btn-primary btn-select">
          ${selected ? "Geselecteerd" : "Selecteer"}
        </button>
        <a href="company.html?slug=${company.slug}" class="btn-secondary">Bekijk</a>
      </div>
    `;

    const btn = qs(".btn-select", card);

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

  function renderStartCompany() {
    const box = qs("#startCompanyBox");
    if (!box || !state.request?.startCompany) return;

    box.classList.remove("hidden");
    box.innerHTML = "";

    const card = renderCompanyCard(state.request.startCompany, { selected: true });
    box.appendChild(card);
  }

  function renderCompanies() {
    const list = qs("#companiesList");
    list.innerHTML = "";

    const startId = state.request?.startCompany?._id;

    state.allCompanies
      .filter(c => c._id !== startId)
      .forEach(company => {
        list.appendChild(renderCompanyCard(company));
      });
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
    state.allCompanies = data.companies || [];

    renderMessage("");
    renderStartCompany();
    renderCompanies();
    updateCounter();

    state.initialized = true;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
