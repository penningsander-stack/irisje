// frontend/js/index.js
// v20251207-PREMIUM-HOME
//
// Verantwoordelijk voor:
// - Laden van populaire categorieën
// - Klikbare tegelweergave met emoji-iconen
// - Bewaren van bestaande zoekfunctionaliteit (indien aanwezig elders)
//
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
  "Ondernemersdiensten": "📊",
  "Catering": "🍽️",
  "Wellness": "🌿",
  "Coaching": "🧭",
  "IT & Websites": "💻",
  "Overig": "📦",
};

function getCategoryIcon(name) {
  if (!name) return "📌";
  const directMatch = CATEGORY_ICONS[name.trim()];
  if (directMatch) return directMatch;

  // Eenvoudige fuzzy matches voor veel voorkomende woorden
  const lower = name.toLowerCase();
  if (lower.includes("schoon")) return "🧹";
  if (lower.includes("dier")) return "🐾";
  if (lower.includes("tuin") || lower.includes("hovenier")) return "🌳";
  if (lower.includes("verhuis")) return "🚚";
  if (lower.includes("klus") || lower.includes("bouw")) return "🔧";
  if (lower.includes("schilder")) return "🎨";
  if (lower.includes("loodgiet")) return "💧";
  if (lower.includes("elektr")) return "🔌";
  if (lower.includes("coach")) return "🧭";
  if (lower.includes("it") || lower.includes("web") || lower.includes("online")) return "💻";

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
      cache: "no-cache",
    });

    if (!res.ok) throw new Error(`Server antwoordde met status ${res.status}`);
    const data = await res.json();

    const categories = Array.isArray(data.categories)
      ? data.categories
      : Array.isArray(data)
        ? data
        : [];

    if (!categories.length) {
      container.innerHTML = `
        <div class="col-span-full text-center text-[11px] text-slate-400">
          Nog geen populaire categorieën gevonden.
        </div>
      `;
      return;
    }

    container.innerHTML = "";

    categories.forEach((cat) => {
      const name = cat.name || cat.category || "Categorie";
      const slug = cat.slug || encodeURIComponent(name.toLowerCase());
      const icon = getCategoryIcon(name);

      const tile = document.createElement("a");
      tile.href = `results.html?category=${slug}`;
      tile.className =
        "surface-card p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-2 " +
        "shadow-sm hover:shadow-md hover:-translate-y-0.5 transition transform cursor-pointer";

      tile.innerHTML = `
        <div class="text-2xl sm:text-3xl">${icon}</div>
        <div class="font-medium text-slate-800 text-[11px] sm:text-sm leading-snug">
          ${name}
        </div>
      `;

      container.appendChild(tile);
    });
  } catch (err) {
    console.error("❌ Fout bij laden populaire categorieën:", err);
    container.innerHTML = `
      <div class="col-span-full text-center text-[11px] text-red-500">
        Fout bij het laden van populaire categorieën.
      </div>
    `;
  }
}
