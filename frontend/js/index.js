// frontend/js/index.js
// v2026-01-12 — sector + plaats correct verwerkt

// ======================================================
// VASTE SECTOREN
// ======================================================
const FIXED_CATEGORIES = [
  { slug: "aannemer", label: "Aannemer", emoji: "📌" },
  { slug: "advocaat", label: "Advocaat", emoji: "⚖️" },
  { slug: "airco", label: "Airco", emoji: "❄️" },
  { slug: "bouwbedrijf", label: "Bouwbedrijf", emoji: "🔧" },
  { slug: "dakdekker", label: "Dakdekker", emoji: "🏠" },
  { slug: "duurzaam", label: "Duurzaam", emoji: "🌱" },
  { slug: "elektricien", label: "Elektricien", emoji: "🔌" },
  { slug: "glaszetter", label: "Glaszetter", emoji: "🪟" },
  { slug: "hovenier", label: "Hovenier", emoji: "🌳" },
  { slug: "installatie", label: "Installatie", emoji: "📌" },
  { slug: "isolatie", label: "Isolatie", emoji: "🧱" },
  { slug: "juridisch", label: "Juridisch", emoji: "⚖️" },
  { slug: "klusbedrijf", label: "Klusbedrijf", emoji: "🔧" },
  { slug: "loodgieter", label: "Loodgieter", emoji: "💧" },
  { slug: "schilder", label: "Schilder", emoji: "🎨" },
  { slug: "schoonmaakbedrijf", label: "Schoonmaakbedrijf", emoji: "🧹" },
  { slug: "slotenmaker", label: "Slotenmaker", emoji: "🔑" },
  { slug: "spoedservice", label: "Spoedservice", emoji: "🚨" },
  { slug: "stukadoor", label: "Stukadoor", emoji: "📌" },
  { slug: "tegelzetter", label: "Tegelzetter", emoji: "📌" },
  { slug: "timmerman", label: "Timmerman", emoji: "🪚" },
  { slug: "vloeren", label: "Vloeren", emoji: "📐" },
  { slug: "woninginrichting", label: "Woninginrichting", emoji: "🛋️" },
  { slug: "zonnepanelen", label: "Zonnepanelen", emoji: "☀️" },
];

document.addEventListener("DOMContentLoaded", () => {
  populateSectorSelect();
  initFormSubmit();
  renderFixedCategories();
  initPrimaryCtaFocus();
});

// ======================================================
// Sector dropdown
// ======================================================
function populateSectorSelect() {
  const select = document.getElementById("searchSector");
  if (!select) return;

  FIXED_CATEGORIES.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.slug;
    opt.textContent = `${cat.emoji} ${cat.label}`;
    select.appendChild(opt);
  });
}

// ======================================================
// Form submit → request aanmaken
// ======================================================
function initFormSubmit() {
  const form = document.getElementById("searchForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sector = document.getElementById("searchSector").value;
    const city = document.getElementById("searchCity").value.trim();

    if (!sector) {
      alert("Kies een sector.");
      return;
    }

    try {
      const res = await fetch("/api/publicRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, city })
      });

      const data = await res.json();

      if (!data.requestId) {
        alert("Aanvraag kon niet worden aangemaakt.");
        return;
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (err) {
      alert("Er ging iets mis bij het aanmaken van de aanvraag.");
    }
  });
}

// ======================================================
// Populaire categorieën
// ======================================================
function renderFixedCategories() {
  const container = document.getElementById("popularCategories");
  if (!container) return;

  container.innerHTML = "";

  FIXED_CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = `results.html?sector=${encodeURIComponent(cat.slug)}`;
    a.className = "category-card";
    a.innerHTML = `
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-label">${cat.label}</span>
    `;
    container.appendChild(a);
  });
}

// ======================================================
// UX: CTA focus
// ======================================================
function initPrimaryCtaFocus() {
  const cta = document.querySelector(".primary-cta");
  const firstInput = document.getElementById("searchSector");
  if (!cta || !firstInput) return;

  cta.addEventListener("click", () => {
    setTimeout(() => {
      firstInput.focus();
    }, 250);
  });
}
