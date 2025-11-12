// frontend/js/index.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  /* ============================================================
     🔍 Zoekformulier – categorie + plaats
  ============================================================ */
  const form = document.getElementById("searchForm");
  const categoryInput = document.getElementById("categoryInput");
  const cityInput = document.getElementById("cityInput");
  const resultDiv = document.getElementById("searchResult");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const category = categoryInput.value.trim();
    const city = cityInput.value.trim();

    if (!category && !city) {
      resultDiv.innerHTML = "<p class='text-red-600 text-sm mt-3'>Voer een categorie of plaats in.</p>";
      return;
    }

    resultDiv.innerHTML = "<span class='text-gray-600'>⏳ Zoeken...</span>";

    try {
      const url = `${API_BASE}/companies/search?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
      const res = await fetch(url);
      const contentType = res.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) throw new Error("Geen JSON");
      const data = await res.json();

      if (!res.ok || !data.items?.length) {
        resultDiv.innerHTML = "<p class='text-gray-600 text-sm mt-3'>Geen resultaten gevonden.</p>";
        return;
      }

      // ✅ Toon max. 3 resultaten in mini-overzicht
      resultDiv.innerHTML = data.items.slice(0, 3).map(c => `
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mt-3 shadow-sm card-fade-in">
          <div class="flex items-start justify-between">
            <div class="font-semibold text-indigo-700 text-sm leading-snug">${c.name || ""}</div>
            <div class="text-yellow-500 text-xs leading-none">${"⭐".repeat(Math.round(c.avgRating || 0))}</div>
          </div>
          <div class="text-gray-600 text-xs mt-1">${c.city || ""}</div>
          <div class="text-gray-500 text-xs mt-1 leading-relaxed">${c.tagline || ""}</div>
          <a class="text-indigo-600 hover:text-indigo-700 text-xs font-medium block mt-2" href="company.html?slug=${encodeURIComponent(c.slug)}">Bekijk profiel →</a>
        </div>
      `).join("") + `
        <div class="text-center mt-4">
          <a class="inline-block text-indigo-600 hover:text-indigo-700 text-xs font-semibold" 
             href="results.html?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}">
            Alle resultaten bekijken →
          </a>
        </div>`;
    } catch (err) {
      console.error("❌ Fout bij zoeken:", err);
      resultDiv.innerHTML = "<p class='text-red-600 text-sm mt-3'>❌ Er ging iets mis bij het laden van resultaten.</p>";
    }
  });

  /* ============================================================
     💡 Populaire categorieën
  ============================================================ */
  const popularContainer = document.getElementById("popularCategories");
  const popularCategories = ["Loodgieter", "CV / Verwarming", "Elektricien", "Schoonmaak", "Slotenmaker", "Glazenwasser"];

  if (popularContainer) {
    popularContainer.innerHTML = popularCategories
      .map(cat => `
        <a href="results.html?category=${encodeURIComponent(cat)}"
           class="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition p-4 text-center card-fade-in">
          <div class="font-semibold text-gray-800 group-hover:text-indigo-700">${cat}</div>
        </a>
      `)
      .join("");
  }

  /* ============================================================
     ⚙️ Stappenplan – Hoe het werkt
  ============================================================ */
  const stepsContainer = document.getElementById("howItWorks");
  const steps = [
    ["1. Vertel wat je nodig hebt", "Beschrijf je klus of probleem. Hoe duidelijker je bent, hoe sneller je geholpen wordt."],
    ["2. Bedrijven reageren", "Betrouwbare bedrijven ontvangen je aanvraag en reageren vaak dezelfde dag."],
    ["3. Jij kiest", "Vergelijk prijs, snelheid en beoordelingen. Jij beslist wie de klus krijgt."]
  ];

  if (stepsContainer) {
    stepsContainer.innerHTML = steps
      .map(([title, text]) => `
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 card-fade-in">
          <div class="text-indigo-600 font-semibold mb-2 text-sm">${title}</div>
          <p class="text-gray-700 leading-relaxed">${text}</p>
        </div>
      `)
      .join("");
  }

  /* ============================================================
     💬 Reviews – statisch voorbeeldblok
  ============================================================ */
  const reviewsContainer = document.getElementById("reviews");
  const reviews = [
    ["⭐⭐⭐⭐⭐", "“Binnen een uur een loodgieter geregeld. Super snel en eerlijk geprijsd.”", "Sanne, Amsterdam"],
    ["⭐⭐⭐⭐", "“Duidelijke communicatie en ze waren supernetjes bij ons thuis.”", "Peter, Utrecht"],
    ["⭐⭐⭐⭐⭐", "“Volgende keer bel ik weer via Irisje in plaats van Googlen.”", "Linda, Rotterdam"]
  ];

  if (reviewsContainer) {
    reviewsContainer.innerHTML = reviews
      .map(([stars, msg, name]) => `
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-5 card-fade-in">
          <div class="text-yellow-500 text-sm font-semibold leading-none">${stars}</div>
          <p class="text-gray-800 mt-2 leading-relaxed">${msg}</p>
          <div class="text-gray-500 text-xs mt-3">— ${name}</div>
        </div>
      `)
      .join("");
  }
});
