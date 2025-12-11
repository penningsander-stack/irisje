// frontend/js/index_search.js
// v20251213-SEARCH-ADVANCED-TRUSTOO-STEP1
//
// Uitgebreide zoeklogica voor de homepage:
// - Stuurt categorie + plaats door naar results.html via querystring
// - Toont eenvoudige autocomplete-suggesties voor categorie en plaats
//   (zoals Trustoo-stijl, maar client-side zonder backendwijzigingen)

(function () {
  const POPULAR_CATEGORIES = [
    "Advocaat",
    "Arbeidsrecht advocaat",
    "Letselschade advocaat",
    "Strafrecht advocaat",
    "Schilder",
    "Loodgieter",
    "Elektricien",
    "Dakdekker",
    "Aannemer",
    "Tegelzetter",
    "Hovenier",
    "Schoonmaakbedrijf",
    "Isolatiespecialist",
    "Slotenmaker",
    "Glaszetter",
    "Stukadoor"
  ];

  const POPULAR_CITIES = [
    "Amsterdam",
    "Rotterdam",
    "Den Haag",
    "Utrecht",
    "Eindhoven",
    "Tilburg",
    "Groningen",
    "Almere",
    "Breda",
    "Nijmegen",
    "Arnhem",
    "Haarlem",
    "Enschede",
    "Apeldoorn",
    "Amersfoort",
    "Zwolle",
    "Leiden",
    "Dordrecht",
    "Zoetermeer"
  ];

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("searchForm");
    const categoryInput = document.getElementById("searchCategory");
    const cityInput = document.getElementById("searchCity");

    // Als formulier niet bestaat, niets doen
    if (!form) return;

    // ✅ Standaard submit: stuur door naar results.html met querystring
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const category = categoryInput ? (categoryInput.value || "").trim() : "";
      const city = cityInput ? (cityInput.value || "").trim() : "";

      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (city) params.set("city", city);

      // Als gebruiker niets invult → toon gewoon alle bedrijven
      const qs = params.toString();
      if (qs) {
        window.location.href = "results.html?" + qs;
      } else {
        window.location.href = "results.html";
      }
    });

    // ✅ Autocomplete voor categorie + plaats
    if (categoryInput) {
      attachAutocomplete(categoryInput, POPULAR_CATEGORIES);
    }
    if (cityInput) {
      attachAutocomplete(cityInput, POPULAR_CITIES);
    }
  });

  function attachAutocomplete(inputEl, suggestions) {
    // Maak een container voor de dropdown
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.zIndex = "50";
    container.style.background = "#ffffff";
    container.style.border = "1px solid #e2e8f0";
    container.style.borderRadius = "0.75rem";
    container.style.marginTop = "2px";
    container.style.boxShadow = "0 10px 25px rgba(15,23,42,0.12)";
    container.style.fontSize = "13px";
    container.style.color = "#0f172a";
    container.style.maxHeight = "260px";
    container.style.overflowY = "auto";
    container.style.padding = "4px 0";
    container.style.display = "none";

    // Wrapper voor positionering
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    // Plaats wrapper rond het input element
    const parent = inputEl.parentNode;
    parent.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);
    wrapper.appendChild(container);

    let hideTimeout = null;

    inputEl.addEventListener("input", function () {
      const query = (inputEl.value || "").toLowerCase().trim();
      clearTimeout(hideTimeout);

      if (!query) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      const matches = suggestions
        .filter((item) => item.toLowerCase().includes(query))
        .slice(0, 8);

      if (matches.length === 0) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      container.innerHTML = "";
      matches.forEach((item) => {
        const row = document.createElement("button");
        row.type = "button";
        row.textContent = item;
        row.style.display = "block";
        row.style.width = "100%";
        row.style.textAlign = "left";
        row.style.padding = "6px 10px";
        row.style.background = "transparent";
        row.style.border = "none";
        row.style.cursor = "pointer";

        row.addEventListener("mouseenter", function () {
          row.style.background = "#eff6ff";
        });
        row.addEventListener("mouseleave", function () {
          row.style.background = "transparent";
        });

        row.addEventListener("click", function () {
          inputEl.value = item;
          container.style.display = "none";
          container.innerHTML = "";
          inputEl.focus();
        });

        container.appendChild(row);
      });

      container.style.display = "block";
    });

    inputEl.addEventListener("focus", function () {
      if (container.innerHTML.trim() !== "") {
        container.style.display = "block";
      }
    });

    inputEl.addEventListener("blur", function () {
      hideTimeout = setTimeout(function () {
        container.style.display = "none";
      }, 150);
    });
  }
})();
