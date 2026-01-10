// frontend/js/register-company.js
// v2026-01-17 — Stap 4A: afdwingen categorie-slugs bij registratie (frontend-only)

const API_BASE = "https://irisje-backend.onrender.com/api";

// Canonieke categorieën (labels = UI, slug = opslag)
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

document.addEventListener("DOMContentLoaded", init);

function normalize(val) {
  return String(val || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function init() {
  const form = document.getElementById("registerCompanyForm");
  if (!form) return;

  // Verwacht een <select multiple id="categories">
  const categoriesSelect = document.getElementById("categories");
  if (categoriesSelect) {
    fillCategories(categoriesSelect);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      location.href = "/login.html";
      return;
    }

    // Verzamel velden (pas namen aan indien jouw HTML afwijkt)
    const payload = {
      name: form.name?.value?.trim(),
      city: form.city?.value?.trim(),
      description: form.description?.value?.trim() || "",
      // 🔒 afdwingen: alleen slugs opslaan
      categories: getSelectedSlugs(categoriesSelect),
    };

    if (!payload.name || !payload.city) {
      showError("Vul bedrijfsnaam en plaats in.");
      return;
    }

    if (!payload.categories.length) {
      showError("Selecteer minimaal één categorie.");
      return;
    }

    try {
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
    }
  });
}

function fillCategories(selectEl) {
  selectEl.innerHTML = "";
  for (const c of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = c.slug;       // 🔒 slug als value
    opt.textContent = c.label; // label alleen voor UI
    selectEl.appendChild(opt);
  }
}

function getSelectedSlugs(selectEl) {
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
