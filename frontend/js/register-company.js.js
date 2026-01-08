// frontend/js/register-company.js
// v20260108-REGISTER-COMPANY
// Bedrijfsregistratie (frontend)
// - Laadt categorieën & specialismen
// - Valideert invoer
// - Veilige submit met foutafhandeling

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
  select.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    select.appendChild(opt);
  }
}

form.addEventListener("submit", async (e) => {
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

  if (!fd.get("name") || !fd.get("city")) {
    showError("Vul alle verplichte velden in.");
    return;
  }

  if (categories.length === 0) {
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
        name: fd.get("name").trim(),
        city: fd.get("city").trim(),
        categories,
        specialties,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Registratie mislukt.");
    }

    if (!data.companyId) {
      throw new Error("Onverwachte serverrespons.");
    }

    localStorage.setItem("companyId", data.companyId);
    location.href = "dashboard.html";

  } catch (err) {
    showError(err.message || "Netwerkfout. Probeer opnieuw.");
  } finally {
    setLoading(false);
  }
});

function setLoading(state) {
  submitBtn.disabled = state;
  submitText.classList.toggle("hidden", state);
  submitSpinner.classList.toggle("hidden", !state);
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("hidden");
}

function clearError() {
  errorBox.textContent = "";
  errorBox.classList.add("hidden");
}
