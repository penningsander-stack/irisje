// frontend/js/request.js
// Start aanvraag + plaats-autocomplete (stabiel en eenvoudig)

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

  if (!form || !categorySelect || !cityInput || !cityHidden || !suggestionsBox || !errorBox) {
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

    const matches = PLACES.filter(p => p.toLowerCase().startsWith(query));
    if (!matches.length) considerHide();

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

    suggestionsBox.style.display = matches.length ? "block" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.style.display = "none";
    }
  });

  function considerHide() {
    suggestionsBox.style.display = "none";
  }

  // --------------------
  // Submit
  // --------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    const sector = (categorySelect.value || "").trim();
    const city = (cityHidden.value || "").trim();

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
      const url = "https://irisje-backend.onrender.com/api/publicRequests";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        },
        cache: "no-store",
        body: JSON.stringify({ sector, city })
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      // Verwacht: { requestId: "..." }
      const data = await res.json();
      if (!data || !data.requestId) {
        throw new Error("Geen requestId ontvangen");
      }

      window.location.href = `/results.html?requestId=${encodeURIComponent(data.requestId)}`;

    } catch (err) {
      console.error(err);
      errorBox.textContent = "Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw.";
      errorBox.classList.remove("hidden");
    }
  });
});
