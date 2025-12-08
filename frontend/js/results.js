// frontend/js/results.js — v20251208-STABLE
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const resultsContainer = document.getElementById("resultsContainer");

  // Als de container ontbreekt, geen fout meer gooien
  if (!resultsContainer) {
    console.warn("[results.js] Geen element met id='resultsContainer' gevonden.");
  }

  // Zoek optioneel naar formulier + velden (niet verplicht aanwezig)
  const form = document.getElementById("searchForm");
  const categoryInput = document.getElementById("category");
  const cityInput = document.getElementById("city");

  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category") || urlParams.get("q") || "";
  const initialCity = urlParams.get("city") || "";

  // Direct zoeken bij laden als er queryparameters zijn
  if (resultsContainer && (initialCategory || initialCity)) {
    searchCompanies(initialCategory, initialCity);
  }

  // Alleen event-listener koppelen als formulier en velden bestaan
  if (form && categoryInput && cityInput && resultsContainer) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const category = categoryInput.value.trim();
      const city = cityInput.value.trim();
      searchCompanies(category, city);
    });
  }

  async function searchCompanies(category, city) {
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "<p class='text-slate-500 text-sm'>Zoeken…</p>";

    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (city) params.set("city", city);

      const response = await fetch(`${apiBase}/api/companies/search?${params.toString()}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const companies = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);

      if (!companies.length) {
        resultsContainer.innerHTML = "<p class='text-slate-500 text-sm'>Geen bedrijven gevonden voor deze zoekopdracht.</p>";
        return;
      }

      resultsContainer.innerHTML = "";

      companies.forEach((company) => {
        const card = document.createElement("article");
        card.className =
          "surface-card p-5 rounded-2xl shadow-soft hover:shadow-lg transition card-fade-in flex flex-col gap-3";

        const verified =
          company.isVerified
            ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium ml-2">✔ Geverifieerd</span>`
            : "";

        const avgRating = typeof company.avgRating === "number" && company.avgRating > 0
          ? `<span class="text-amber-500 text-sm mr-1">${"★".repeat(Math.round(company.avgRating))}</span>
             <span class="text-[11px] text-slate-500 align-middle">(${company.reviewCount || 0} reviews)</span>`
          : `<span class="text-[11px] text-slate-400">Nog geen reviews</span>`;

        const categories =
          Array.isArray(company.categories) && company.categories.length
            ? company.categories
                .slice(0, 4)
                .map(
                  (cat) =>
                    `<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-medium">${cat}</span>`
                )
                .join("")
            : "";

        const city = company.city || "";
        const tagline = company.tagline || "";
        const slug = company.slug || company._id || "";

        card.innerHTML = `
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base sm:text-lg font-semibold text-slate-900 flex items-center flex-wrap gap-1">
                ${company.name || "Onbekend bedrijf"}${verified}
              </h2>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                ${city ? `<span>${city}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="text-sm text-slate-600">
            ${tagline}
          </div>

          <div class="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
            ${avgRating}
          </div>

          <div class="flex flex-wrap gap-1.5 mt-2">
            ${categories}
          </div>

          <div class="mt-3 flex justify-end">
            <a href="company.html?slug=${encodeURIComponent(slug)}"
               class="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition">
              Bekijk profiel
            </a>
          </div>
        `;

        resultsContainer.appendChild(card);
      });
    } catch (error) {
      console.error("[results.js] Fout bij laden van bedrijven:", error);
      if (resultsContainer) {
        resultsContainer.innerHTML =
          "<p class='text-red-600 text-sm'>Er ging iets mis bij het ophalen van bedrijven. Probeer het later opnieuw.</p>";
      }
    }
  }
});
