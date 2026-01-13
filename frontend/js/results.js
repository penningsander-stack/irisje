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
      if (!res.ok) throw new Error(data?.error || "Send failed");

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
