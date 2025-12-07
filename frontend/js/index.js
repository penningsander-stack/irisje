// frontend/js/index.js
// v20251208-PREMIUM-HOME

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initPopularCategories();
});

const CATEGORY_ICONS = {
  "Schoonmaak": "🧹",
  "Dierenverzorging": "🐾",
  "Hovenier": "🌳",
  "Elektricien": "🔌",
  "Schilder": "🎨",
  "Loodgieter": "💧",
  "Klus & Bouw": "🔧",
  "Verhuisservice": "🚚",
  "IT & Websites": "💻",
  "Coaching": "🧭",
  "Overig": "📦",
};

const FALLBACK_CATEGORIES = [
  { name: "Loodgieter", slug: "loodgieter" },
  { name: "Elektricien", slug: "elektricien" },
  { name: "Schilder", slug: "schilder" },
  { name: "Hovenier", slug: "hovenier" },
  { name: "Schoonmaak", slug: "schoonmaak" },
  { name: "Klus & Bouw", slug: "klus-bouw" },
  { name: "Dierenverzorging", slug: "dierenverzorging" },
  { name: "IT & Websites", slug: "it-websites" },
];

function getCategoryIcon(name) {
  if (!name) return "📌";
  if (CATEGORY_ICONS[name]) return CATEGORY_ICONS[name];

  const lower = name.toLowerCase();
  if (lower.includes("schoon")) return "🧹";
  if (lower.includes("dier")) return "🐾";
  if (lower.includes("tuin") || lower.includes("hovenier")) return "🌳";
  if (lower.includes("lood")) return "💧";
  if (lower.includes("elektr")) return "🔌";
  if (lower.includes("schilder")) return "🎨";
  if (lower.includes("klus") || lower.includes("bouw")) return "🔧";
  if (lower.includes("it") || lower.includes("web")) return "💻";
  if (lower.includes("coach")) return "🧭";

  return "📌";
}

async function initPopularCategories() {
  const container = document.getElementById("popularCategories");
  if (!container) return;

  container.innerHTML = `
    <div class="col-span-full text-center text-[11px] text-slate-400">
      Populaire categorieën worden geladen…
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/publicRequests/popular-categories`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Endpoint bestaat niet");

    const data = await res.json();
    const categories = Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data)
      ? data
      : [];

    if (!categories.length) throw new Error("Geen categorieën gevonden");

    renderCategories(categories);
  } catch (err) {
    console.warn("⚠️ Gebruik fallback categorieën:", err.message);
    renderCategories(FALLBACK_CATEGORIES);
  }
}

function renderCategories(categories) {
  const container = document.getElementById("popularCategories");
  container.innerHTML = "";

  categories.forEach((cat) => {
    const name = cat.name || cat.category || "Categorie";
    const slug = cat.slug || encodeURIComponent(name.toLowerCase());
    const icon = getCategoryIcon(name);

    const tile = document.createElement("a");
    tile.href = `results.html?category=${slug}`;
    tile.className =
      "surface-card p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition transform cursor-pointer";

    tile.innerHTML = `
      <div class="text-2xl sm:text-3xl">${icon}</div>
      <div class="font-medium text-slate-800 text-[11px] sm:text-sm leading-snug">${name}</div>
    `;

    container.appendChild(tile);
  });
}
