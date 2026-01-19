// frontend/js/request.js
// Aanvraag starten – specialisme tijdelijk uitgeschakeld (alleen categorie + plaats)

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

  // Specialisme-elementen blijven bestaan in HTML,
  // maar worden functioneel niet meer gebruikt
  const specialtyOptions = document.getElementById("specialtyOptions");
  const specialtyOtherWrap = document.getElementById("specialtyOtherWrap");
  const specialtyOtherInput = document.getElementById("specialtyOther");

  const cityInput = document.getElementById("cityInput");
  const cityHidden = document.getElementById("city");
  const suggestionsBox = document.getElementById("citySuggestions");
  const errorBox = document.getElementById("formError");

  if (
    !form ||
    !categorySelect ||
    !cityInput ||
    !cityHidden ||
    !suggestionsBox ||
    !errorBox
  ) {
    console.error("request.js: vereiste form-elementen ontbreken");
    return;
  }

  // --------------------
  // Specialisme UI verbergen (veilig)
  // --------------------
  if (specialtyOptions) specialtyOptions.innerHTML = "";
  if (specialtyOtherWrap) specialtyOtherWrap.classList.add("hidden");
  if (specialtyOtherInput) specialtyOtherInput.value = "";

  // --------------------
  // Plaats autocomplete
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

  document.addEventListener("click", e => {
    if (!e.target.closest(".autocomplete")) {
      suggestionsBox.style.display = "none";
    }
  });

  // --------------------
  // Submit
  // --------------------
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    const sector = categorySelect.value.trim();
    const city = cityHidden.value.trim();

    if (!sector) return showError("Kies een categorie.");
    if (!city) return showError("Kies een plaats uit de lijst.");

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ sector, city })
        }
      );

      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      if (!data.requestId) throw new Error("Geen requestId");

      window.location.href =
        `/results.html?requestId=${encodeURIComponent(data.requestId)}`;

    } catch (err) {
      console.error(err);
      showError("Er ging iets mis bij het starten van je aanvraag.");
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }
});
