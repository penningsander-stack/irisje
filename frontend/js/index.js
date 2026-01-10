// frontend/js/index.js
// v2026-01-10 — NORMALISATIE: sector (voorheen category)

// ======================================================
// VASTE SECTOREN (CENTRALE DEFINITIE)
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
  renderFixedCategories();
  initHowItWorks?.();
  initReviews?.();
});

function renderFixedCategories() {
  const container = document.getElementById("popularCategories");
  if (!container) return;

  container.innerHTML = "";

  FIXED_CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    // ⬇️ NORMALISATIE: sector
    a.href = `results.html?sector=${encodeURIComponent(cat.slug)}`;
    a.className = "category-card";
    a.innerHTML = `
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-label">${cat.label}</span>
    `;
    container.appendChild(a);
  });
}

// ongewijzigde helpers
function initHowItWorks() { /* idem als voorheen */ }
function initReviews() { /* idem als voorheen */ }
