// frontend/js/results.js
// v2026-01-13 — DOM-safe + auto-create companyBlock + send support

console.log("RESULTS JS LOADED", new Date().toISOString());

const API = "https://irisje-backend.onrender.com/api/publicRequests";

const params = new URLSearchParams(window.location.search);
const requestId = params.get("requestId");

// Bestaande elementen (defensief)
const genericTitle = document.getElementById("genericTitle");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const step1Form = document.getElementById("step1Form");

function safeText(el, text) {
  if (el) el.textContent = text;
}

function setError(text) {
  safeText(formError, text);
  if (formError && formError.classList) formError.classList.remove("hidden");
}

function clearError() {
  if (formError) formError.textContent = "";
  if (formError && formError.classList) formError.classList.add("hidden");
}

function disableSubmit(text) {
  if (!submitBtn) return;
  submitBtn.disabled = true;
  if (typeof text === "string" && text.trim()) submitBtn.textContent = text;
}

function enableSubmit(text) {
  if (!submitBtn) return;
  submitBtn.disabled = false;
  if (typeof text === "string" && text.trim()) submitBtn.textContent = text;
}

function ensureCompanyBlock() {
  let companyBlock = document.getElementById("companyBlock");
  if (companyBlock) return companyBlock;

  // Maak hem aan op een logische plek
  companyBlock = document.createElement("div");
  companyBlock.id = "companyBlock";
  companyBlock.className = "company-list";

  if (step1Form) {
    // Bovenaan in het formulier, vóór eventuele foutmelding/knop
    const first = step1Form.firstElementChild;
    if (first) step1Form.insertBefore(companyBlock, first);
    else step1Form.appendChild(companyBlock);
    console.warn("companyBlock ontbrak in DOM → automatisch aangemaakt in step1Form");
    return companyBlock;
  }

  const main = document.querySelector("main");
  if (main) {
    main.insertBefore(companyBlock, main.firstChild);
    console.warn("companyBlock ontbrak in DOM → automatisch aangemaakt in <main>");
    return companyBlock;
  }

  document.body.insertBefore(companyBlock, document.body.firstChild);
  console.warn("companyBlock ontbrak in DOM → automatisch aangemaakt in <body>");
  return companyBlock;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let companies = [];
const selectedIds = new Set();

if (!requestId) {
  setError("Geen aanvraag-ID gevonden.");
  disableSubmit();
  throw new Error("Missing requestId");
}

clearError();
disableSubmit("Bedrijven laden…");

fetch(`${API}/${encodeURIComponent(requestId)}`)
  .then(async (r) => {
    // Backend kan fouten als JSON teruggeven; behandel netjes
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || "Request failed");
    return data;
  })
  .then((data) => {
    companies = Array.isArray(data.companies) ? data.companies : [];

    const companyBlock = ensureCompanyBlock();

    if (companies.length === 0) {
      safeText(genericTitle, "Geen bedrijven beschikbaar voor deze aanvraag.");
      companyBlock.innerHTML = "";
      disableSubmit();
      return;
    }

    safeText(genericTitle, "Kies bedrijven voor je aanvraag");
    companyBlock.innerHTML = "";

    companies.forEach((company) => {
      const id = company?._id;
      if (!id) return;

      const label = document.createElement("label");
      label.className = "company-card";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "companyIds";
      checkbox.value = id;

      checkbox.addEventListener("change", () => {
        const checkedCount = document.querySelectorAll('input[name="companyIds"]:checked').length;

        if (checkbox.checked) {
          if (checkedCount > 5) {
            checkbox.checked = false;
            alert("Je kunt maximaal 5 bedrijven selecteren.");
            return;
          }
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }

        // knop aan/uit
        if (submitBtn) submitBtn.disabled = selectedIds.size === 0;
      });

      const info = document.createElement("div");
      info.className = "company-info";
      info.innerHTML = `
        <strong>${escapeHtml(company.name)}</strong><br>
        <span class="muted">${escapeHtml(company.city || "")}</span>
      `;

      label.appendChild(checkbox);
      label.appendChild(info);
      companyBlock.appendChild(label);
    });

    // start: niets geselecteerd
    disableSubmit("Aanvraag versturen naar geselecteerde bedrijven");
    if (submitBtn) submitBtn.disabled = true;
  })
  .catch((err) => {
    console.error(err);
    setError("Kon bedrijven niet laden.");
    disableSubmit();
  });

// Verzenden (alleen als formulier bestaat)
if (step1Form) {
  step1Form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const selected = Array.from(document.querySelectorAll('input[name="companyIds"]:checked')).map(
      (cb) => cb.value
    );

    if (selected.length === 0) {
      alert("Selecteer minimaal één bedrijf.");
      return;
    }

    disableSubmit("Bezig…");

    try {
      const res = await fetch(`${API}/${encodeURIComponent(requestId)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: selected }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.e// frontend/js/results.js
// v2026-01-13 — matches premium results.html IDs exactly

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api/publicRequests";

  // ---- URL ----
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  // ---- DOM (as in results.html) ----
  const cityInput = document.getElementById("cityInput");
  const applyCityBtn = document.getElementById("applyCityBtn");

  const selectionCounter = document.getElementById("selectionCounter");
  const selectionHint = document.getElementById("selectionHint");
  const resultsStatus = document.getElementById("resultsStatus");

  const startCompanyBox = document.getElementById("startCompanyBox");
  const companiesList = document.getElementById("companiesList");

  const submitSelectionBtn = document.getElementById("submitSelectionBtn");

  // ---- Defensive hard checks (don’t crash) ----
  function must(el, name) {
    if (!el) {
      console.error(`Missing DOM element: #${name}`);
      return false;
    }
    return true;
  }

  const domOk =
    must(cityInput, "cityInput") &&
    must(applyCityBtn, "applyCityBtn") &&
    must(selectionCounter, "selectionCounter") &&
    must(selectionHint, "selectionHint") &&
    must(resultsStatus, "resultsStatus") &&
    must(startCompanyBox, "startCompanyBox") &&
    must(companiesList, "companiesList") &&
    must(submitSelectionBtn, "submitSelectionBtn");

  if (!domOk) return;

  if (!requestId) {
    resultsStatus.textContent = "Geen aanvraag-ID gevonden.";
    submitSelectionBtn.disabled = true;
    return;
  }

  // ---- State ----
  let allCompanies = [];
  let visibleCompanies = [];
  const selectedIds = new Set();
  let startCompanyId = null;

  // ---- Helpers ----
  const norm = (v) => (v || "").toString().trim().toLowerCase();

  function setStatus(text) {
    resultsStatus.textContent = text || "";
  }

  function setHint(text) {
    selectionHint.textContent = text || "";
  }

  function updateCounter() {
    selectionCounter.textContent = `${selectedIds.size} van 5 geselecteerd`;
    submitSelectionBtn.disabled = selectedIds.size === 0;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function companyCard(company) {
    const id = company?._id;
    const name = escapeHtml(company?.name || "Onbekend bedrijf");
    const city = escapeHtml(company?.city || "");

    const wrapper = document.createElement("div");
    wrapper.className =
      "glass-card p-4 flex items-start gap-3 hover:shadow-brand transition";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "mt-1";
    checkbox.checked = selectedIds.has(id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (selectedIds.size >= 5) {
          checkbox.checked = false;
          setHint("Maximaal 5 bedrijven selecteren.");
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
    info.className = "min-w-0";
    info.innerHTML = `
      <div class="font-semibold text-slate-900 truncate">${name}</div>
      ${city ? `<div class="text-xs text-slate-500 mt-1">${city}</div>` : ""}
    `;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(info);
    return wrapper;
  }

  function renderStartCompany(request) {
    startCompanyBox.classList.add("hidden");
    startCompanyBox.innerHTML = "";
    startCompanyId = null;

    const c = request?.company;
    if (!c || !c._id) return;

    startCompanyId = String(c._id);

    startCompanyBox.classList.remove("hidden");
    startCompanyBox.innerHTML = `
      <div class="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Je doet een aanvraag bij</div>
      <div class="font-semibold text-slate-900">${escapeHtml(c.name || "")}</div>
      ${c.city ? `<div class="text-xs text-slate-500 mt-1">${escapeHtml(c.city)}</div>` : ""}
      <div class="text-[11px] text-slate-500 mt-2">Dit bedrijf staat bovenaan. Je kunt daarnaast tot 4 andere bedrijven kiezen.</div>
    `;
  }

  function renderList() {
    companiesList.innerHTML = "";

    if (!visibleCompanies.length) {
      setStatus("Geen bedrijven beschikbaar voor deze aanvraag.");
      return;
    }

    // Optioneel: startbedrijf altijd bovenaan in de lijst (als aanwezig)
    const list = [...visibleCompanies];
    if (startCompanyId) {
      const idx = list.findIndex((c) => String(c._id) === startCompanyId);
      if (idx > 0) {
        const [start] = list.splice(idx, 1);
        list.unshift(start);
      }
    }

    list.forEach((c) => {
      companiesList.appendChild(companyCard(c));
    });

    setStatus("");
  }

  function applyCityFilter() {
    const q = norm(cityInput.value);
    setHint("");

    if (!q) {
      visibleCompanies = [...allCompanies];
      setStatus("");
      renderList();
      return;
    }

    const matched = allCompanies.filter((c) => {
      const hay = `${norm(c.city)} ${norm(c.place)} ${norm(c.location)} ${norm(c.zip)} ${norm(c.postcode)}`;
      return hay.includes(q);
    });

    if (matched.length === 0) {
      // Fallback: toon alles
      visibleCompanies = [...allCompanies];
      setHint("Geen exacte match op plaats. We tonen alle beschikbare bedrijven.");
    } else {
      visibleCompanies = matched;
      setHint(`Gefilterd op: ${cityInput.value.trim()}`);
    }

    renderList();
  }

  // ---- Load ----
  async function init() {
    try {
      setStatus("Bedrijven worden geladen…");
      submitSelectionBtn.disabled = true;

      const res = await fetch(`${API_BASE}/${encodeURIComponent(requestId)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data?.error || "Kon de aanvraag niet laden.");
        return;
      }

      const request = data?.request || null;
      const companies = Array.isArray(data?.companies) ? data.companies : [];

      renderStartCompany(request);

      allCompanies = companies;
      visibleCompanies = [...allCompanies];

      // Als request al companyIds heeft (sent), pre-checken (optioneel)
      if (Array.isArray(request?.companyIds)) {
        request.companyIds.slice(0, 5).forEach((id) => selectedIds.add(String(id)));
      }

      updateCounter();
      renderList();
    } catch (e) {
      console.error(e);
      setStatus("Kon bedrijven niet laden.");
    }
  }

  // ---- Events ----
  applyCityBtn.addEventListener("click", (e) => {
    e.preventDefault();
    applyCityFilter();
  });

  submitSelectionBtn.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;

    submitSelectionBtn.disabled = true;
    submitSelectionBtn.textContent = "Bezig…";
    setHint("");

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(requestId)}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyIds: Array.from(selectedIds).slice(0, 5),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Verzenden mislukt.");
      }

      window.location.href = `/success.html?requestId=${encodeURIComponent(requestId)}`;
    } catch (e) {
      console.error(e);
      setHint("Verzenden mislukt. Probeer het opnieuw.");
      submitSelectionBtn.disabled = false;
      submitSelectionBtn.textContent = "Aanvraag versturen naar geselecteerde bedrijven";
      updateCounter();
    }
  });

  // ---- Start ----
  init();
})();
rror || "Send failed");

      window.location.href = `/success.html?requestId=${encodeURIComponent(requestId)}`;
    } catch (err) {
      console.error(err);
      setError("Versturen mislukt. Probeer het opnieuw.");
      enableSubmit("Aanvraag versturen naar geselecteerde bedrijven");
      if (submitBtn) submitBtn.disabled = selectedIds.size === 0;
    }
  });
} else {
  console.warn("step1Form ontbreekt in DOM → send handler niet gekoppeld.");
}
