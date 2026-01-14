// js/request.js
// Verantwoordelijk voor:
// - plaats-autocomplete
// - validatie
// - starten van een aanvraag

// Vast ingestelde plaatsnamen (kan later dynamisch)
const PLACES = [
  "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
  "Groningen", "Leeuwarden", "Zwolle", "Arnhem", "Nijmegen",
  "Breda", "Tilburg", "Haarlem", "Alkmaar", "Amersfoort",
  "Apeldoorn", "Leiden", "Dordrecht", "Gouda", "Middelburg",
  "Burgh-Haamstede"
];

// DOM references (defensief)
const form = document.getElementById("requestForm");
const categorySelect = document.getElementById("category");
const cityInput = document.getElementById("cityInput");
const cityHidden = document.getElementById("city");
const suggestionsBox = document.getElementById("citySuggestions");
const errorBox = document.getElementById("formError");

if (!form || !categorySelect || !cityInput || !cityHidden) {
  console.error("Request form elements missing");
  return;
}

// --------------------
// Autocomplete plaats
// --------------------

cityInput.addEventListener("input", () => {
  const query = cityInput.value.trim().toLowerCase();
  suggestionsBox.innerHTML = "";
  cityHidden.value = "";

  if (!query) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = PLACES.filter(place =>
    place.toLowerCase().startsWith(query)
  );

  if (matches.length === 0) {
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

// Klik buiten autocomplete → sluiten
document.addEventListener("click", (e) => {
  if (!e.target.closest(".autocomplete")) {
    suggestionsBox.style.display = "none";
  }
});

// --------------------
// Form submit
// --------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.add("hidden");

  const category = categorySelect.value;
  const city = cityHidden.value;

  if (!category) {
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
        body: JSON.stringify({ category, city })
      }
    );

    if (!res.ok) {
      throw new Error("Request failed");
    }

    const data = await res.json();

    if (!data || !data.requestId) {
      throw new Error("Invalid response");
    }

    window.location.href = `/results.html?requestId=${data.requestId}`;

  } catch (err) {
    console.error(err);
    errorBox.textContent =
      "Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw.";
    errorBox.classList.remove("hidden");
  }
});
