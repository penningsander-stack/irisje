// frontend/js/results.js
document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const resultsContainer = document.getElementById("results");
  const form = document.getElementById("searchForm");
  const categoryInput = document.getElementById("category");
  const cityInput = document.getElementById("city");

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";
  const initialCity = params.get("city") || "";

  if (initialCategory) categoryInput.value = initialCategory;
  if (initialCity) cityInput.value = initialCity;
  if (initialCategory || initialCity) searchCompanies(initialCategory, initialCity);

  form.addEventListener("submit", e => {
    e.preventDefault();
    const category = categoryInput.value.trim();
    const city = cityInput.value.trim();
    searchCompanies(category, city);
  });

  async function searchCompanies(category, city) {
    resultsContainer.innerHTML = "<p class='text-gray-500'>Zoeken...</p>";
    try {
      const response = await axios.get(`${apiBase}/api/companies/search`, { params: { category, city } });
      const companies = response.data.items || [];
      if (!companies.length) {
        resultsContainer.innerHTML = "<p class='text-gray-500'>Geen bedrijven gevonden.</p>";
        return;
      }

      resultsContainer.innerHTML = "";
      companies.forEach(company => {
        const div = document.createElement("div");
        // ✅ Fade-in klasse toegevoegd
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
              .map(
                cat =>
                  `<span class='bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm'>${cat}</span>`
              )
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
