// js/request.js
// Start aanvraag + plaats-autocomplete (PWA-robust)

document.addEventListener("DOMContentLoaded", () => {

  const PLACES = [
    "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
    "Groningen", "Leeuwarden", "Zwolle", "Arnhem", "Nijmegen",
    "Breda", "Tilburg", "Haarlem", "Alkmaar", "Amersfoort",
    "Apeldoorn", "Leiden", "Dordrecht", "Gouda", "Middelburg",
    "Burgh-Haamstede"
  ];

  const form = document.getElementById("requestForm");
  const categorySelect = document.getElementById("category");
  const cityInput = document.getElementById("cityInput");
  const cityHidden = document.getElementById("city");
  const suggestionsBox = document.getElementById("citySuggestions");
  const errorBox = document.getElementById("formError");

  if (!form || !categorySelect || !cityInput || !cityHidden) {
    console.error("request.js: formulier-elementen niet gevonden");
    return;
  }

  // --------------------
  // Autocomplete
  // --------------------
  cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";
    cityHidden.value = "";

    if (!query) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = PLACES.filter(p =>
      p.toLowerCase().startsWith(query)
    );

    if (!matches.length) {
      suggestionsBox.style.display = "none";
      return;
    }

    matches.forEach(place => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = place;
      item.addEventListener("click", () => {
        cityInput.value = place;
        cityHidden.value = place;
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
      });
      suggestionsBox.appendChild(item);
    });

    suggestionsBox.style.display = "block";
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.style.display = "none";
    }
  });

  // --------------------
  // Submit
  // --------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    const sector = categorySelect.value;
    const city = cityHidden.value;

    if (!sector) {
      errorBox.textContent = "Kies eerst een categorie.";
      errorBox.classList.remove("hidden");
      return;
    }

    if (!city) {
      errorBox.textContent = "Kies een plaats uit de lijst.";
      errorBox.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector, city })
        }
      );

      // Succes = HTTP OK, ongeacht body (PWA-proof)
      if (!res.ok) {
        throw new Error("Request failed");
      }

      // Probeer requestId te lezen, maar faal hier niet op
      let requestId = null;
      try {
        const data = await res.json();
        if (data && data.requestId) {
          requestId = data.requestId;
        }
      } catch (_) {
        // body kan leeg/gewijzigd zijn door Service Worker
      }

      // Redirect altijd bij succes
      if (requestId) {
        window.location.href = `/results.html?requestId=${requestId}`;
      } else {
        // Fallback: results laat zelf de laatste aanvraag ophalen
        window.location.href = `/results.html`;
      }

    } catch (err) {
      console.error(err);
      errorBox.textContent =
        "Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw.";
      errorBox.classList.remove("hidden");
    }
  });

});
