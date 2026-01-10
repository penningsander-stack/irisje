// frontend/js/register-company.js
// v2026-01-17 — FIX: IDs afgestemd op register-company.html + slug-afdwinging

const API_BASE = "https://irisje-backend.onrender.com/api";

// Canonieke categorieën
const CATEGORIES = [
  { slug: "elektricien", label: "Elektricien" },
  { slug: "loodgieter", label: "Loodgieter" },
  { slug: "schilder", label: "Schilder" },
  { slug: "dakdekker", label: "Dakdekker" },
  { slug: "aannemer", label: "Aannemer" },
  { slug: "klusbedrijf", label: "Klusbedrijf" },
  { slug: "hovenier", label: "Hovenier" },
  { slug: "stukadoor", label: "Stukadoor" },
  { slug: "advocaat", label: "Advocaat" },
  { slug: "juridisch", label: "Juridisch advies" },
];

// (Frontend-only) vaste specialismen
const SPECIALTIES = [
  { slug: "spoedservice", label: "Spoedservice" },
  { slug: "24-7-bereikbaar", label: "24/7 bereikbaar" },
  { slug: "duurzaam", label: "Duurzaam werken" },
  { slug: "particulier", label: "Particulieren" },
  { slug: "zakelijk", label: "Zakelijk" },
];

document.addEventListener("DOMContentLoaded", init);

function normalize(val) {
  return String(val || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function init() {
  const form = document.getElementById("companyForm");
  if (!form) return;

  const categoriesSelect = document.getElementById("categoriesSelect");
  const specialtiesSelect = document.getElementById("specialtiesSelect");

  if (categoriesSelect) fillSelect(categoriesSelect, CATEGORIES);
  if (specialtiesSelect) fillSelect(specialtiesSelect, SPECIALTIES);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      location.href = "/login.html";
      return;
    }

    hideError();

    const payload = {
      name: form.name?.value?.trim(),
      city: form.city?.value?.trim(),
      categories: getSelected(categoriesSelect),
      specialties: getSelected(specialtiesSelect),
    };

    if (!payload.name || !payload.city) {
      return showError("Vul bedrijfsnaam en plaats in.");
    }

    if (!payload.categories.length) {
      return showError("Selecteer minimaal één categorie.");
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Registratie mislukt.");
      }

      location.href = "/dashboard.html";
    } catch (err) {
      showError(err.message || "Netwerkfout.");
      setLoading(false);
    }
  });
}

function fillSelect(selectEl, items) {
  selectEl.innerHTML = "";
  for (const item of items) {
    const opt = document.createElement("option");
    opt.value = item.slug;        // 🔒 slug als value
    opt.textContent = item.label; // label voor UI
    selectEl.appendChild(opt);
  }
}

function getSelected(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions)
    .map(o => normalize(o.value))
    .filter(Boolean);
}

function showError(msg) {
  const box = document.getElementById("formError");
  if (!box) return;
  box.textContent = msg;
  box.classList.remove("hidden");
}

function hideError() {
  const box = document.getElementById("formError");
  if (!box) return;
  box.textContent = "";
  box.classList.add("hidden");
}

function setLoading(state) {
  const btn = document.getElementById("submitBtn");
  const spinner = document.getElementById("submitSpinner");
  if (btn) btn.disabled = state;
  if (spinner) spinner.classList.toggle("hidden", !state);
}
