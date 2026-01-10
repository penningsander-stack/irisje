// frontend/js/register-company.js
// v2026-01-17 — CATEGORIES DEFINITIEF COMPLEET

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
  // ✅ VOLLEDIGE sectorlijst (canoniek)
  const categories = [
    { value: "elektricien", label: "Elektricien" },
    { value: "loodgieter", label: "Loodgieter" },
    { value: "schilder", label: "Schilder" },
    { value: "dakdekker", label: "Dakdekker" },
    { value: "aannemer", label: "Aannemer" },
    { value: "klusbedrijf", label: "Klusbedrijf" },
    { value: "hovenier", label: "Hovenier" },
    { value: "stukadoor", label: "Stukadoor" },
    { value: "advocaat", label: "Advocaat" },
    { value: "juridisch", label: "Juridisch advies" },
  ];

  const specialties = [
    { value: "arbeidsrecht", label: "Arbeidsrecht" },
    { value: "ontslagrecht", label: "Ontslagrecht" },
    { value: "cv-installatie", label: "CV-installatie" },
    { value: "groepenkast", label: "Groepenkast" },
    { value: "schilderwerk", label: "Schilderwerk" },
    { value: "stucwerk", label: "Stucwerk" },
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

  if (!categories.length) {
    showError("Selecteer minimaal één sector.");
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

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Registratie mislukt.");
    }

    location.href = "dashboard.html?onboarding=1";
  } catch (err) {
    showError(err.message || "Netwerkfout.");
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
