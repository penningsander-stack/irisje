// frontend/js/results.js
/* v2026-01-14 SAFE-NO-CRASH */

(() => {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";
  const qs = (s, r = document) => r.querySelector(s);

  const state = {
    requestId: null,
    request: {},
    companies: [],
    selectedIds: new Set()
  };

  const safe = (v) => (v == null ? "" : String(v));

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
    el.textContent = safe(text);
  }

  // VEILIGE RESOLVERS — NOOIT CRASHEN
  function getName(c) {
    return safe(c && (c.name || c.companyName || "Onbekend bedrijf"));
  }
  function getCity(c) {
    return safe(c && (c.city || c.place || ""));
  }
  function getSlug(c) {
    return safe(c && (c.slug || c.companySlug || ""));
  }
  function getId(c) {
    return safe(c && (c._id || c.id || c.companyId || ""));
  }

  function renderCompany(company, selected = false) {
    if (!company) return document.createDocumentFragment();

    const id = getId(company);
    const slug = getSlug(company);

    const card = document.createElement("div");
    card.className = "glass-card p-4 flex flex-col";

    card.innerHTML = `
      <strong class="text-sm mb-1">${getName(company)}</strong>
      <span class="text-xs text-slate-500 mb-2">${getCity(company)}</span>
      <span class="text-xs text-slate-500 mb-3">Score: ${safe(company.score ?? 0)}</span>
      <div class="mt-auto flex gap-2">
        <button class="btn-primary select-btn">
          ${selected ? "Geselecteerd" : "Selecteer"}
        </button>
        ${slug ? `<a href="company.html?slug=${encodeURIComponent(slug)}" class="btn-secondary">Bekijk</a>` : ``}
      </div>
    `;

    const btn = card.querySelector(".select-btn");

    if (selected && id) state.selectedIds.add(id);

    btn.addEventListener("click", () => {
      if (!id) return;
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
      setMessage("Aanvraag niet gevonden.");
      return;
    }

    setMessage("Bedrijven laden…");

    let data;
    try {
      const res = await fetch(`${API_BASE}/api/publicRequests/${state.requestId}`);
      data = await res.json();
    } catch {
      setMessage("Fout bij laden van bedrijven.");
      return;
    }

    state.request = data.request || {};
    state.companies = Array.isArray(data.companies) ? data.companies : [];

    // Startbedrijf is OPTIONEEL: match op slug, fallback id
    const startSlug = safe(state.request.companySlug);
    const startId   = safe(state.request.companyId);

    let startCompany =
      (startSlug && state.companies.find(c => getSlug(c) === startSlug)) ||
      (startId && state.companies.find(c => getId(c) === startId)) ||
      null;

    const others = startCompany
      ? state.companies.filter(c => c !== startCompany)
      : state.companies.slice();

    const startBox = qs("#startCompanyBox");
    if (startCompany && startBox) {
      startBox.classList.remove("hidden");
      startBox.innerHTML = "";
      startBox.appendChild(renderCompany(startCompany, true));
    }

    const list = qs("#companiesList");
    if (list) {
      list.innerHTML = "";
      others.forEach(c => list.appendChild(renderCompany(c)));
    }

    updateCounter();
    setMessage("");

    console.log("RESULTS OK", {
      startFound: !!startCompany,
      selected: state.selectedIds.size,
      companies: state.companies.length
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
