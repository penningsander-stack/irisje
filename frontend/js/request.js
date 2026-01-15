// frontend/js/request.js
// Start aanvraag + plaats-autocomplete + VERPLICHT specialisme (keuze via radiobuttons/chips + optioneel "Anders")

document.addEventListener("DOMContentLoaded", () => {
  const PLACES = [
    "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
    "Groningen", "Leeuwarden", "Zwolle", "Arnhem", "Nijmegen",
    "Breda", "Tilburg", "Haarlem", "Alkmaar", "Amersfoort",
    "Apeldoorn", "Leiden", "Dordrecht", "Gouda", "Middelburg",
    "Burgh-Haamstede"
  ];

  // Alleen voor advocaat geven we een set "chips" mee.
  // Voor alle overige sectoren kan de gebruiker via "Anders" verplicht invullen.
  const SPECIALTIES_BY_SECTOR = {
    advocaat: [
      "Arbeidsrecht",
      "Strafrecht",
      "Letselschade",
      "Familierecht",
      "Huurrecht",
      "Bestuursrecht",
      "Ondernemingsrecht",
      "Vastgoedrecht",
      "Privacyrecht",
      "Asielrecht",
      "Vreemdelingenrecht"
    ]
  };

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
  // Specialisme UI (radiobuttons/chips)
  // --------------------
  let specialtyValue = ""; // definitieve gekozen waarde die we versturen
  let otherInputEl = null;

  const specialtyWrap = document.createElement("div");
  specialtyWrap.className = "mt-4";

  const specialtyTitle = document.createElement("label");
  specialtyTitle.className = "block text-sm font-medium mb-2";
  specialtyTitle.textContent = "Kies een specialisme";

  const specialtyHint = document.createElement("p");
  specialtyHint.className = "text-sm text-slate-600 mb-2";
  specialtyHint.textContent = "Bedrijven ontvangen alleen aanvragen binnen hun specialisme.";

  const radiosContainer = document.createElement("div");
  radiosContainer.className = "flex flex-wrap gap-2";

  const otherWrap = document.createElement("div");
  otherWrap.className = "mt-3 hidden";

  const otherLabel = document.createElement("label");
  otherLabel.className = "block text-sm font-medium mb-1";
  otherLabel.textContent = "Vul je specialisme in";

  otherInputEl = document.createElement("input");
  otherInputEl.type = "text";
  otherInputEl.className = "w-full";
  otherInputEl.placeholder = "Bijv. contracten, echtscheiding, lekkage, groepenkast…";
  otherInputEl.autocomplete = "off";

  otherWrap.appendChild(otherLabel);
  otherWrap.appendChild(otherInputEl);

  specialtyWrap.appendChild(specialtyTitle);
  specialtyWrap.appendChild(specialtyHint);
  specialtyWrap.appendChild(radiosContainer);
  specialtyWrap.appendChild(otherWrap);

  // Plaats specialtyWrap direct ná de categorie-select (zonder HTML aan te passen)
  categorySelect.parentElement?.appendChild(specialtyWrap);

  // Bouw de “chips” opnieuw bij wijziging van sector
  function renderSpecialtyOptions() {
    const sectorRaw = (categorySelect.value || "").trim();
    const sectorKey = normalize(sectorRaw);

    specialtyValue = "";
    radiosContainer.innerHTML = "";
    otherWrap.classList.add("hidden");
    otherInputEl.value = "";

    if (!sectorRaw) {
      // Nog geen sector gekozen: laat niets selecteerbaars zien
      return;
    }

    const list = SPECIALTIES_BY_SECTOR[sectorKey] || [];

    // 1) Presets (alleen als we ze hebben)
    list.forEach((label) => {
      radiosContainer.appendChild(makeChipRadio(label, label, false));
    });

    // 2) Altijd: "Anders" optie met verplicht invulveld
    radiosContainer.appendChild(makeChipRadio("Anders (invullen)", "__OTHER__", true));
  }

  function makeChipRadio(labelText, value, isOther) {
    const id = `spec_${Math.random().toString(16).slice(2)}`;

    const wrapper = document.createElement("div");
    wrapper.className = "inline-flex";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "specialtyChoice";
    input.id = id;
    input.value = value;
    input.className = "sr-only";

    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.className =
      "cursor-pointer select-none rounded-full border px-3 py-1 text-sm " +
      "hover:bg-slate-50";

    label.textContent = labelText;

    input.addEventListener("change", () => {
      // visuele “selected” state
      [...radiosContainer.querySelectorAll("label")].forEach(l => {
        l.classList.remove("bg-slate-900", "text-white", "border-slate-900");
      });
      label.classList.add("bg-slate-900", "text-white", "border-slate-900");

      if (isOther) {
        otherWrap.classList.remove("hidden");
        specialtyValue = ""; // wordt pas geldig bij invullen
        // focus voor snelheid
        setTimeout(() => otherInputEl.focus(), 0);
      } else {
        otherWrap.classList.add("hidden");
        otherInputEl.value = "";
        specialtyValue = labelText;
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(label);
    return wrapper;
  }

  otherInputEl.addEventListener("input", () => {
    // Alleen als “Anders” geselecteerd is
    const chosen = form.querySelector('input[name="specialtyChoice"]:checked');
    if (chosen && chosen.value === "__OTHER__") {
      specialtyValue = (otherInputEl.value || "").trim();
    }
  });

  categorySelect.addEventListener("change", () => {
    renderSpecialtyOptions();
  });

  // Initial render
  renderSpecialtyOptions();

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

  func
