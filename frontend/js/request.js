// frontend/js/request.js
// v2026-01-11 — Stap P1.1 Optie B (Trustoo-stijl)
// - Als companySlug aanwezig is: toon gekozen bedrijf + categorie/specialisme optioneel met uitleg
// - Als companySlug ontbreekt: normale matching-wizard (categorie/specialisme verplicht)

const API_BASE = "https://irisje-backend.onrender.com/api";

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");

const step1Form = document.getElementById("step1Form");
const step2Form = document.getElementById("step2Form");

const categorySelect = document.getElementById("categorySelect");
const specialtySelect = document.getElementById("specialtySelect");
const summaryText = document.getElementById("summaryText");

const pageTitle = document.getElementById("pageTitle");

const singleCompanyBox = document.getElementById("singleCompanyBox");
const singleCompanyName = document.getElementById("singleCompanyName");
const singleCompanyMeta = document.getElementById("singleCompanyMeta");

const companySearchLabel = document.getElementById("companySearchLabel");
const companySearchHelp = document.getElementById("companySearchHelp");

let CATEGORIES = {};
let step1Data = {};
let selectedCompanySlug = null;
let selectedCompany = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  selectedCompanySlug = params.get("companySlug");

  await loadCategories();

  if (selectedCompanySlug) {
    await enableSingleCompanyMode(selectedCompanySlug);
  }
}

/* =========================
   Categories
========================= */

async function loadCategories() {
  if (!categorySelect || !specialtySelect) return;

  categorySelect.innerHTML = `<option value="">Kies een categorie</option>`;
  specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
  specialtySelect.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/publicCategories`);
    const data = await res.json();

    if (!res.ok || !data.ok || !Array.isArray(data.categories)) {
      throw new Error("Categorieën laden mislukt.");
    }

    CATEGORIES = {};
    data.categories.forEach((c) => {
      CATEGORIES[c.value] = c;
      categorySelect.insertAdjacentHTML(
        "beforeend",
        `<option value="${escapeHtmlAttr(c.value)}">${escapeHtml(c.label)}</option>`
      );
    });
  } catch (e) {
    console.error(e);
    alert("Categorieën laden mislukt");
  }
}

if (categorySelect) {
  categorySelect.addEventListener("change", () => {
    const key = categorySelect.value;

    specialtySelect.innerHTML = "";
    specialtySelect.disabled = true;

    if (!key || !CATEGORIES[key]) {
      specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
      return;
    }

    const specs = Array.isArray(CATEGORIES[key].specialties)
      ? CATEGORIES[key].specialties
      : [];

    const opts = specs
      .map((s) => `<option value="${escapeHtmlAttr(s.value)}">${escapeHtml(s.label)}</option>`)
      .join("");

    specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>${opts}`;
    specialtySelect.disabled = false;
  });
}

/* =========================
   Step 1 -> Step 2
========================= */

if (step1Form) {
  step1Form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fd = new FormData(step1Form);
    step1Data = Object.fromEntries(fd.entries());

    // Single-company: categorie/specialisme optioneel. Bij leeg: geen error.
    // Multi-company: categorie/specialisme verplicht via HTML "required".
    if (!selectedCompanySlug) {
      const cat = CATEGORIES[step1Data.category];
      const spec = cat?.specialties?.find((s) => s.value === step1Data.specialty);

      if (summaryText) {
        if (cat && spec) {
          summaryText.textContent =
            `Je zoekt een ${cat.label.toLowerCase()} gespecialiseerd in ${spec.label.toLowerCase()}. ` +
            `Met de vragen hieronder vinden we sneller de juiste match.`;
        } else {
          summaryText.textContent =
            "Met de vragen hieronder vinden we sneller de juiste match.";
        }
      }
    } else {
      if (summaryText) {
        const name = selectedCompany?.name ? selectedCompany.name : "het geselecteerde bedrijf";
        summaryText.textContent =
          `Je aanvraag wordt verstuurd naar ${name}. Met de vragen hieronder kunnen zij je sneller helpen.`;
      }
    }

    if (step1) step1.classList.add("hidden");
    if (step2) step2.classList.remove("hidden");
  });
}

/* =========================
   Submit
========================= */

if (step2Form) {
  step2Form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd2 = new FormData(step2Form);
    const step2Data = Object.fromEntries(fd2.entries());

    const payload = {
      ...step1Data,
      ...step2Data,
      companySlug: selectedCompanySlug || null,
    };

    try {
      const res = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data?.error || "Verzenden mislukt");
        return;
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (err) {
      console.error(err);
      alert("Verzenden mislukt");
    }
  });
}

/* =========================
   Single company mode (optie B)
========================= */

async function enableSingleCompanyMode(slug) {
  // 1) UI copy
  if (pageTitle) pageTitle.textContent = "Vraag een offerte aan";
  if (companySearchLabel) companySearchLabel.textContent = "Extra informatie (optioneel)";
  if (companySearchHelp) {
    companySearchHelp.textContent =
      "Je aanvraag wordt rechtstreeks naar dit bedrijf gestuurd. " +
      "Categorie en specialisme helpen het bedrijf je sneller te helpen (optioneel).";
  }

  // 2) required uitzetten voor single-company
  if (categorySelect) categorySelect.required = false;
  if (specialtySelect) specialtySelect.required = false;

  // 3) Bedrijf ophalen en tonen
  try {
    const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
    const data = await res.json();

    if (res.ok && data.ok && data.company) {
      selectedCompany = data.company;

      if (singleCompanyBox) singleCompanyBox.classList.remove("hidden");
      if (singleCompanyName) singleCompanyName.textContent = selectedCompany.name || "—";

      const meta = [
        selectedCompany.city || null,
        selectedCompany.isVerified ? "Geverifieerd" : null,
      ].filter(Boolean).join(" • ");

      if (singleCompanyMeta) singleCompanyMeta.textContent = meta || "—";
    }
  } catch (e) {
    console.warn("Kon geselecteerd bedrijf niet laden.");
  }
}

/* =========================
   Utils
========================= */

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeHtmlAttr(str) {
  // voor value="" attribuut
  return escapeHtml(str).replace(/`/g, "&#096;");
}
