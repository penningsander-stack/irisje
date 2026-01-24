// frontend/js/request-form.js
// Irisje.nl – Aanvraagformulier: specialisme + plaats
// Verantwoordelijkheid: UI-logica, geen submit, geen backend-wijzigingen

document.addEventListener("DOMContentLoaded", initRequestForm);

const API_BASE = "https://irisje-backend.onrender.com/api";

let CATEGORY_CONFIG = [];

function initRequestForm() {
  const categorySelect = document.querySelector(
    "select[name='category'], select#category"
  );
  const specialtyWrap = document.getElementById("specialtyOptions");
  const specialtyInput = document.getElementById("specialty");
  const cityInputVisible = document.getElementById("cityInput");
  const cityInputHidden = document.getElementById("city");

  if (!categorySelect || !specialtyWrap || !specialtyInput) return;

  // 1. Categories + specialties laden
  loadCategories().then(() => {
    // 2. Init vanuit URL (sector)
    const params = new URLSearchParams(window.location.search);
    const sectorFromUrl = params.get("sector");
    if (sectorFromUrl) {
      categorySelect.value = sectorFromUrl;
    }
    renderSpecialties();
  });

  // 3. Bij wijziging categorie → specialismes opnieuw renderen
  categorySelect.addEventListener("change", () => {
    specialtyInput.value = "";
    renderSpecialties();
  });

  // 4. Plaats: zichtbare input → hidden input
  if (cityInputVisible && cityInputHidden) {
    const syncCity = () => {
      cityInputHidden.value = cityInputVisible.value.trim();
    };
    cityInputVisible.addEventListener("blur", syncCity);
    cityInputVisible.addEventListener("change", syncCity);
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/meta/categories`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.categories)) {
      CATEGORY_CONFIG = data.categories;
    }
  } catch (e) {
    console.error("❌ Laden categorieën mislukt", e);
  }
}

function renderSpecialties() {
  const categorySelect = document.querySelector(
    "select[name='category'], select#category"
  );
  const specialtyWrap = document.getElementById("specialtyOptions");
  const specialtyInput = document.getElementById("specialty");

  specialtyWrap.innerHTML = "";

  const categoryKey = categorySelect.value;
  if (!categoryKey) return;

  const category = CATEGORY_CONFIG.find((c) => c.key === categoryKey);
  if (!category || !Array.isArray(category.specialties)) return;

  category.specialties.forEach((spec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = spec.label;
    btn.className =
      "px-3 py-2 rounded-xl border border-slate-300 text-sm " +
      "hover:bg-indigo-50 hover:border-indigo-400";

    btn.addEventListener("click", () => {
      // visuele selectie resetten
      specialtyWrap
        .querySelectorAll("button")
        .forEach((b) => b.classList.remove("bg-indigo-100", "border-indigo-500"));

      // selectie markeren
      btn.classList.add("bg-indigo-100", "border-indigo-500");

      // waarde vastleggen voor request.js
      specialtyInput.value = spec.key;
    });

    specialtyWrap.appendChild(btn);
  });
}
