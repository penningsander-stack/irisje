// frontend/js/index.js
// v2026-01-10 — FIX: vaste categorieën op homepage (optie A)

// ======================================================
// VASTE CATEGORIEËN (CENTRALE DEFINITIE)
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

// ======================================================
// INIT
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  renderFixedCategories();
  initHowItWorks?.();
  initReviews?.();
});

// ======================================================
// RENDER CATEGORIES (HOMEPAGE)
// ======================================================
function renderFixedCategories() {
  const container = document.getElementById("popularCategories");
  if (!container) return;

  container.innerHTML = "";

  FIXED_CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = `results.html?category=${encodeURIComponent(cat.slug)}`;
    a.className = "category-card";

    a.innerHTML = `
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-label">${cat.label}</span>
    `;

    container.appendChild(a);
  });
}

// ======================================================
// BESTAANDE LOGICA (ONGEWIJZIGD)
// ======================================================

// Hoe het werkt (indien aanwezig)
function initHowItWorks() {
  const el = document.getElementById("howItWorks");
  if (!el) return;

  el.innerHTML = `
    <div class="how-card">
      <strong>1. Beschrijf je aanvraag</strong>
      <p>Vertel kort wat je zoekt en waar.</p>
    </div>
    <div class="how-card">
      <strong>2. Vergelijk bedrijven</strong>
      <p>Bekijk profielen en reviews.</p>
    </div>
    <div class="how-card">
      <strong>3. Kies en start</strong>
      <p>Neem direct contact op.</p>
    </div>
  `;
}

// Reviews (indien aanwezig)
function initReviews() {
  const el = document.getElementById("reviews");
  if (!el) return;

  el.innerHTML = `
    <div class="review-card">“Snel geholpen en goede service.”</div>
    <div class="review-card">“Duidelijk overzicht en betrouwbare bedrijven.”</div>
    <div class="review-card">“Fijn platform om te vergelijken.”</div>
  `;
}
