// frontend/js/register-company.js
// v20260109-REGISTER-COMPANY-ONBOARDING
// Bedrijfsregistratie (frontend)
// - Laadt categorieën & specialismen (nu nog statisch)
// - Valideert invoer
// - Submit + foutafhandeling
// - Na succes: door naar dashboard met onboarding-flag

const API_BASE = "https://irisje-backend.onrender.com/api";

const form = document.getElementById("companyForm");
const categoriesSelect = document.getElementById("categoriesSelect");
const specialtiesSelect = document.getElementById("specialtiesSelect");
const errorBox = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const submitSpinner = document.getElementById("submitSpinner");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "login.html";
    return;
  }

  // Extra safety: zorg dat inputs editable zijn op deze pagina
  const nameEl = form?.querySelector('[name="name"]');
  const cityEl = form?.querySelector('[name="city"]');
  if (nameEl) {
    nameEl.disabled = false;
    nameEl.readOnly = false;
  }
  if (cityEl) {
    cityEl.disabled = false;
    cityEl.readOnly = false;
  }

  await loadStaticOptions();
}

async function loadStaticOptions() {
  // Bewust read-only / non-breaking
  // Later eenvoudig te vervangen door API-endpoints
  const categories = [
    { value: "advocaat", label: "Advocaat" },
    { value: "juridisch", label: "Juridisch advies" },
  ];

  const specialties = [
    { value: "arbeidsrecht", label: "Arbeidsrecht" },
    { value: "ontslagrecht", label: "Ontslagrecht" },
  ];

  fillSelect(categoriesSelect, categories);
  fillSelect(specialtiesSelect, specialties);
}

function fillSelect(select, items) {
  if (!select) return;
  select.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    select.appendChild(opt);
  }
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "login.html";
    return;
  }

  const fd = new FormData(form);
  const categories = fd.getAll("categories");
  const specialties = fd.getAll("specialties");

  const name = (fd.get("name") || "").toString().trim();
  const city = (fd.get("city") || "").toString().trim();

  if (!name || !city) {
    showError("Vul alle verplichte velden in.");
    return;
  }

  if (!Array.isArray(categories) || categories.length === 0) {
    showError("Selecteer minimaal één categorie.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${API_BASE}/companies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        name,
        city,
        categories,
        specialties,
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.error || "Registratie mislukt.");
    }

    if (!data?.companyId) {
      throw new Error("Onverwachte serverrespons.");
    }

    localStorage.setItem("companyId", data.companyId);

    // Onboarding: direct duidelijk maken dat profiel in dashboard verder ingevuld wordt
    location.href = "dashboard.html?onboarding=1";
  } catch (err) {
    showError(err?.message || "Netwerkfout. Probeer opnieuw.");
  } finally {
    setLoading(false);
  }
});

function setLoading(state) {
  if (!submitBtn || !submitText || !submitSpinner) return;
  submitBtn.disabled = state;
  submitText.classList.toggle("hidden", state);
  submitSpinner.classList.toggle("hidden", !state);
}

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}
