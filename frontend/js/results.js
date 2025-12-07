// frontend/js/results.js — premium fixed version
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const resultsContainer = document.getElementById("results");

  // Probeer optioneel het formulier te vinden
  const form = document.getElementById("searchForm");
  const categoryInput = document.getElementById("category");
  const cityInput = document.getElementById("city");

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || params.get("q") || "";
  const initialCity = params.get("city") || "";

  // Direct zoeken zodra de pagina opent — zelfs als er geen formulier bestaat
  if (initialCategory || initialCity) {
    searchCompanies(initialCategory, initialCity);
  }

  // Alleen formulier-event koppelen als het formulier bestaat
  if (form && categoryInput && cityInput) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      searchCompanies(categoryInput.value.trim(), cityInput.value.trim());
    });
  }

  async function searchCompanies(category, city) {
    resultsContainer.innerHTML = "<p class='text-gray-500'>Zoeken...</p>";
    try {
      const response = await axios.get(`${apiBase}/api/companies/search`, {
        params: { category, city }
      });

      const companies = response.data.items || [];
      if (!companies.length) {
        resultsContainer.innerHTML = "<p class='text-gray-500'>Geen bedrijven gevonden.</p>";
        return;
      }

      resultsContainer.innerHTML = "";
      companies.forEach(company => {
        const div = document.createElement("div");
        div.className = "bg-white p-5 rounded-2xl shadow hover:shadow-lg transition card-fade-in";

        const verified = company.isVerified
          ? `<span class='text-green-600 font-semibold ml-2'>✔️ Geverifieerd</span>`
          : "";
        const avg = company.avgRating
          ? `<span class='text-yellow-400'>${"⭐".repeat(Math.round(company.avgRating))}</span>`
          : "";

        div.innerHTML = `
          <h2 class="text-xl font-semibold text-indigo-700 mb-1">${company.name} ${verified}</h2>
          <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
            ${avg}<span>(${company.reviewCount || 0} reviews)</span>
          </div>
          <p class="text-gray-700 mb-2">${company.city || ""}</p>
          <p class="text-gray-600 mb-4">${company.tagline || ""}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${(company.categories || [])
              .map(cat => `<span class='bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm'>${cat}</span>`)
              .join("")}
          </div>
          <a href="company.html?slug=${company.slug}"
             class="inline-block bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition">
             Bekijk profiel
          </a>
        `;
        resultsContainer.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML = "<p class='text-red-600'>Er ging iets mis bij het ophalen van bedrijven.</p>";
    }
  }
});
