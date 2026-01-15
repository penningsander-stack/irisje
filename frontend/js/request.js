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
  // Helpers
  // --------------------
  function extractRequestIdFromText(text) {
    if (!text || typeof text !== "string") return null;

    // 1) Probeer JSON parse
    try {
      const obj = JSON.parse(text);
      if (obj && obj.requestId && typeof obj.requestId === "string") return obj.requestId;
    } catch (_) {
      // ignore
    }

    // 2) Fallback regex (als SW/body gek doet)
    const m = text.match(/"requestId"\s*:\s*"([^"]+)"/);
    return m ? m[1] : null;
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

    // Bewaar alvast wat context (handig voor debugging/fallback)
    try {
      localStorage.setItem("lastRequestMeta", JSON.stringify({ sector, city, ts: Date.now() }));
    } catch (_) {
      // ignore
    }

    try {
      // Cachebust + no-store om SW/caching te minimaliseren
      const url = `https://irisje-backend.onrender.com/api/publicRequests?t=${Date.now()}`;

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

      // Lees body als TEXT (meest robuust in PWA/SW situaties)
      let requestId = null;
      try {
        const text = await res.text();
        requestId = extractRequestIdFromText(text);
      } catch (_) {
        // ignore
      }

      // Als we een requestId hebben: altijd opslaan voor results fallback
      if (requestId) {
        try {
          localStorage.setItem("lastRequestId", requestId);
        } catch (_) {
          // ignore
        }
        window.location.href = `/results.html?requestId=${encodeURIComponent(requestId)}`;
        return;
      }

      // Geen requestId teruggekregen (SW/body issue): ga naar results zonder query
      // Results.js moet dan lastRequestId kunnen gebruiken als fallback.
      window.location.href = `/results.html`;

    } catch (err) {
      console.error(err);
      errorBox.textContent = "Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw.";
      errorBox.classList.remove("hidden");
    }
  });
});
