// frontend/js/results.js
(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api/publicRequests";

  const els = {
    contextBlock: document.getElementById("contextBlock"),
    contextText: document.getElementById("contextText"),

    stateLoading: document.getElementById("stateLoading"),
    stateError: document.getElementById("stateError"),
    stateEmpty: document.getElementById("stateEmpty"),
    stateResults: document.getElementById("stateResults"),

    resultsList: document.getElementById("resultsList"),

    actionBar: document.getElementById("actionBar"),
    selectedCount: document.getElementById("selectedCount"),
    sendBtn: document.getElementById("sendBtn"),
    retryBtn: document.getElementById("retryBtn")
  };

  let selectedCompanyIds = [];
  let requestId = null;

  init();

  function init() {
    hideAllStates();
    show(els.stateLoading);

    requestId = getRequestId();
    if (!requestId) {
      return renderError("missing_request");
    }

    fetchResults(requestId);
    if (els.retryBtn) {
      els.retryBtn.addEventListener("click", () => {
        hideAllStates();
        show(els.stateLoading);
        fetchResults(requestId);
      });
    }
  }

  function getRequestId() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("requestId");
    if (fromUrl) {
      sessionStorage.setItem("requestId", fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem("requestId");
  }

  async function fetchResults(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("fetch_failed");

      const data = await res.json();
      if (!data || !data.request) throw new Error("invalid_response");

      renderContext(data.request);

      const companies = Array.isArray(data.companies) ? data.companies : [];
      if (companies.length === 0) {
        hideAllStates();
        show(els.stateEmpty);
        return;
      }

      renderResults(companies);
    } catch (e) {
      renderError(e.message);
    }
  }

  function renderContext(request) {
    els.contextText.textContent = `Gebaseerd op je aanvraag in ${request.city || "jouw regio"}.`;
    show(els.contextBlock);
  }

  function renderResults(companies) {
    els.resultsList.innerHTML = "";
    selectedCompanyIds = [];
    updateSelectionUI();

    companies.forEach(company => {
      const card = document.createElement("div");
      card.className = "surface-card flex items-center justify-between";

      const info = document.createElement("div");
      info.innerHTML = `
        <strong>${escapeHtml(company.name || "Bedrijf")}</strong><br/>
        <span class="text-sm text-slate-500">${escapeHtml(company.city || "")}</span>
      `;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", () =>
        toggleSelection(company._id, checkbox.checked)
      );

      card.appendChild(info);
      card.appendChild(checkbox);
      els.resultsList.appendChild(card);
    });

    hideAllStates();
    show(els.stateResults);
    show(els.actionBar);
  }

  function toggleSelection(id, checked) {
    if (checked) {
      if (selectedCompanyIds.length >= 5) {
        alert("Je kunt maximaal 5 bedrijven selecteren.");
        return;
      }
      if (!selectedCompanyIds.includes(id)) {
        selectedCompanyIds.push(id);
      }
    } else {
      selectedCompanyIds = selectedCompanyIds.filter(x => x !== id);
    }
    updateSelectionUI();
  }

  function updateSelectionUI() {
    els.selectedCount.textContent = selectedCompanyIds.length;
    els.sendBtn.disabled = selectedCompanyIds.length === 0;
  }

  function renderError() {
    hideAllStates();
    show(els.stateError);
  }

  function hideAllStates() {
    [
      els.stateLoading,
      els.stateError,
      els.stateEmpty,
      els.stateResults,
      els.actionBar
    ].forEach(hide);
  }

  function show(el) {
    if (el) el.classList.remove("hidden");
  }

  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[s]));
  }
})();
