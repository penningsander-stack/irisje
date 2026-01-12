// frontend/js/index.js
// v2026-01-12 — HOMEPAGE HERSTEL + CATEGORIE FLOW

const FIXED_CATEGORIES = [
  { slug: "aannemer", label: "Aannemer", emoji: "🏗️" },
  { slug: "dakdekker", label: "Dakdekker", emoji: "🏠" },
  { slug: "elektricien", label: "Elektricien", emoji: "🔌" },
  { slug: "loodgieter", label: "Loodgieter", emoji: "💧" },
  { slug: "schilder", label: "Schilder", emoji: "🎨" },
  { slug: "timmerman", label: "Timmerman", emoji: "🪚" },
  { slug: "stukadoor", label: "Stukadoor", emoji: "🧱" },
  { slug: "installatie", label: "Installatie", emoji: "⚙️" },
  { slug: "hovenier", label: "Hovenier", emoji: "🌳" },
  { slug: "isolatie", label: "Isolatie", emoji: "❄️" },
  { slug: "zonnepanelen", label: "Zonnepanelen", emoji: "☀️" },
  { slug: "schoonmaakbedrijf", label: "Schoonmaakbedrijf", emoji: "🧹" }
];

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
});

function renderCategories() {
  const container = document.getElementById("popularCategoriesGrid");
  if (!container) return;

  container.innerHTML = "";

  FIXED_CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = `request.html?sector=${encodeURIComponent(cat.slug)}`;
    a.className = "category-card";

    a.innerHTML = `
      <span class="category-emoji">${cat.emoji}</span>
      <span class="category-label">${cat.label}</span>
    `;

    container.appendChild(a);
  });
}
