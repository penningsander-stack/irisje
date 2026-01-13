// frontend/js/results.js
/* v2026-01-14 STARTCOMPANY-SLUG-FIRST (DEFINITIEF) */

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

  function setMessage(text = "") {
    const el = qs("#resultsMessage");
    if (!el) return;
    el.style.display = text ? "" : "none";
    el.textContent = text;
  }

  function renderCompany(company, selected = false) {
    const id = company._id || company.id || company.companyId;
    const slug = company.slug || company.companySlug || "";
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
        ${slug ? `<a href="company.html?slug=${encodeURIComponent(slug)}" class="btn-secondary">Bekijk</a>` : ``}
      </div>
    `;

    const btn = card.querySelector(".select-btn");

    if (selected && id) state.selectedIds.add(String(id));

    btn.addEventListener("click", () => {
      const key = String(id);
      if (state.selectedIds.has(key)) {
        state.selectedIds.delete(key);
        btn.textContent = "Selecteer";
      } else {
        if (state.selectedIds.size >= 5) return;
        state.selectedIds.add(key);
        btn.textContent = "Geselecteerd";
      }
      updateCounter();
    });

    return card;
  }

  async function init() {
    state.requestId = getRequestId();
    if (!state.requestId) {
      setMessage("Aanvraag niet gevonden.");
      return;
    }

    setMessage("Bedrijven laden…");

    const res = await fetch(`${API_BASE}/api/publicRequests/${state.requestId}`);
    const data = await res.json();

    state.request = data.request || {};
    state.companies = Array.isArray(data.companies) ? data.companies : [];

    // >>> DEFINITIEVE MATCH-LOGICA <<<
    const startSlug = state.request.companySlug || state.request.startCompanySlug || "";
    const startId   = String(state.request.companyId || "");

    let startCompany = null;

    if (startSlug) {
      startCompany = state.companies.find(c =>
        (c.slug || c.companySlug || "") === startSlug
      );
    }

    if (!startCompany && startId) {
      startCompany = state.companies.find(c =>
        String(c._id || c.id || c.companyId || "") === startId
      );
    }

    const others = startCompany
      ? state.companies.filter(c => c !== startCompany)
      : state.companies.slice();

    // RENDER STARTBEDRIJF
    const startBox = qs("#startCompanyBox");
    if (startCompany && startBox) {
      startBox.classList.remove("hidden");
      startBox.innerHTML = "";
      startBox.appendChild(renderCompany(startCompany, true));
    }

    // RENDER OVERIGE BEDRIJVEN
    const list = qs("#companiesList");
    if (list) {
      list.innerHTML = "";
      others.forEach(c => list.appendChild(renderCompany(c)));
    }

    updateCounter();
    setMessage("");
    console.log("STARTCOMPANY OK", { startSlug, startId, found: !!startCompany });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
