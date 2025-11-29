// frontend/script.js
// Publieke zoekpagina + resultatenlijst

(function () {
  const API_BASE = (window.ENV && window.ENV.API_BASE) || "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("searchForm");
  const inputQ = document.getElementById("q");
  const inputCity = document.getElementById("city");
  const resultsContainer = document.getElementById("resultsContainer");
  const errorBox = document.getElementById("errorBox");

  // Helper: toon foutmelding
  function showError(msg) {
    errorBox.textContent = msg || "Er is een fout opgetreden.";
    errorBox.classList.remove("hidden");
  }

  function hideError() {
    errorBox.classList.add("hidden");
  }

  // Helper: sterren visual
  function renderStars(avgRating) {
    if (!avgRating || avgRating <= 0) return "⭐⭐⭐⭐⭐".slice(0, 0); // leeg
    // we doen het simpel: altijd afgerond op hele sterren omlaag
    const full = Math.floor(avgRating);
    return "⭐".repeat(full);
  }

  // Render bedrijven in resultsContainer
  function renderCompanies(list) {
    resultsContainer.innerHTML = "";

    if (!list || list.length === 0) {
      resultsContainer.innerHTML = `
        <div class="bg-white rounded-xl shadow p-5 text-gray-500 text-sm border border-gray-200">
          Geen bedrijven gevonden.
        </div>
      `;
      return;
    }

    for (const company of list) {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-xl shadow p-5 border border-gray-200 flex flex-col md:flex-row md:items-start md:justify-between";

      const name = company.name || "Onbekend bedrijf";
      const city = company.city || "-";
      const tagline = company.tagline || "";
      const categories = (company.categories && company.categories.length > 0)
        ? company.categories.join(", ")
        : "";
      const stars = renderStars(company.avgRating);
      const ratingText = company.reviewCount
        ? `(${company.reviewCount} reviews)`
        : "(geen reviews)";
      const verified = company.isVerified
        ? `<span class="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded ml-2">Geverifieerd</span>`
        : "";

      // link naar profielpagina
      const profileUrl = `company.html?slug=${encodeURIComponent(company.slug)}`;

      // link naar aanvraagpagina
      const requestUrl = `request.html?company=${encodeURIComponent(company.slug)}`;

      card.innerHTML = `
        <div class="md:max-w-[70%]">
          <div class="flex flex-wrap items-center gap-2">
            <a href="${profileUrl}" class="text-lg font-semibold text-indigo-700 hover:underline">
              ${name}
            </a>
            ${verified}
          </div>

          <div class="text-yellow-500 text-sm leading-none">
            ${stars || "⭐⭐⭐⭐⭐"}
            <span class="text-gray-600 ml-1">${ratingText}</span>
          </div>

          <div class="text-gray-600 text-sm mt-1">${city}</div>

          <div class="text-gray-800 text-sm mt-3 font-medium">${tagline}</div>

          <div class="text-gray-500 text-xs mt-2">
            ${categories ? categories : ""}
          </div>
        </div>

        <div class="mt-4 md:mt-0 flex flex-col gap-2 text-sm">
          <a href="${profileUrl}"
            class="text-center bg-white border border-indigo-600 text-indigo-600 font-semibold rounded-lg px-4 py-2 hover:bg-indigo-50 transition">
            Bekijk profiel
          </a>
          <a href="${requestUrl}"
            class="text-center bg-indigo-600 text-white font-semibold rounded-lg px-4 py-2 hover:bg-indigo-700 transition">
            Vraag een offerte aan
          </a>
        </div>
      `;

      resultsContainer.appendChild(card);
    }
  }

  // Laad resultaten vanaf backend
  async function fetchResults(qVal, cityVal) {
    hideError();
    resultsContainer.innerHTML = `
      <div class="bg-white rounded-xl shadow p-5 border border-gray-200 text-gray-500 text-sm">
        Zoeken...
      </div>
    `;

    // Bouw querystring
    const params = new URLSearchParams();
    if (qVal) params.set("q", qVal);
    if (cityVal) params.set("city", cityVal);

    const url = `${API_BASE}/companies/search?${params.toString()}`;

    try {
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) {
        showError("De server gaf een fout terug.");
        resultsContainer.innerHTML = "";
        return;
      }
      const data = await res.json();

      if (!data.ok) {
        showError(data.error || "Er is een fout opgetreden.");
        resultsContainer.innerHTML = "";
        return;
      }

      renderCompanies(data.items || []);
    } catch (err) {
      console.error("Zoekfout:", err);
      showError("Kon geen verbinding maken met de server.");
      resultsContainer.innerHTML = "";
    }
  }

  // Bij laden pagina:
  // - Vul velden vanuit de URL (q, city)
  // - Doe meteen een fetch
  function initFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const qURL = urlParams.get("q") || "";
    const cityURL = urlParams.get("city") || "";

    inputQ.value = qURL;
    inputCity.value = cityURL;

    fetchResults(qURL, cityURL);
  }

  // Bij verzenden formulier → nieuwe zoekresultaten
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const qVal = inputQ.value.trim();
    const cityVal = inputCity.value.trim();

    // Update de address bar (zodat je kan kopiëren/plakken de zoekopdracht)
    const newParams = new URLSearchParams();
    if (qVal) newParams.set("q", qVal);
    if (cityVal) newParams.set("city", cityVal);

    const newUrl = `results.html?${newParams.toString()}`;
    window.history.replaceState({}, "", newUrl);

    fetchResults(qVal, cityVal);
  });

  // Start
  initFromURL();
})();
