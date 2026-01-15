// frontend/js/request.js

document.addEventListener("DOMContentLoaded", () => {

  const SPECIALTIES = {
    advocaat: [
      "Arbeidsrecht",
      "Strafrecht",
      "Letselschade",
      "Familierecht",
      "Huurrecht",
      "Bestuursrecht"
    ]
  };

  const PLACES = [
    "Amsterdam","Rotterdam","Utrecht","Den Haag","Eindhoven",
    "Groningen","Leeuwarden","Zwolle","Arnhem","Nijmegen"
  ];

  const form = document.getElementById("requestForm");
  const category = document.getElementById("category");
  const specialtyOptions = document.getElementById("specialtyOptions");
  const specialtyOtherWrap = document.getElementById("specialtyOtherWrap");
  const specialtyOther = document.getElementById("specialtyOther");
  const specialtyHidden = document.getElementById("specialty");
  const cityInput = document.getElementById("cityInput");
  const cityHidden = document.getElementById("city");
  const citySuggestions = document.getElementById("citySuggestions");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const errorBox = document.getElementById("formError");

  if (
    !form || !category || !specialtyOptions || !specialtyHidden ||
    !cityInput || !cityHidden || !nameInput || !emailInput
  ) {
    console.error("request.js: vereiste form-elementen ontbreken");
    return;
  }

  /* ----------------- SPECIALISMEN ----------------- */
  category.addEventListener("change", () => {
    specialtyOptions.innerHTML = "";
    specialtyHidden.value = "";
    specialtyOther.value = "";
    specialtyOtherWrap.classList.add("hidden");

    const list = SPECIALTIES[category.value];
    if (!list) return;

    list.forEach(label => addChip(label));
    addChip("Anders", true);
  });

  function addChip(label, isOther = false) {
    const id = "spec_" + Math.random().toString(16).slice(2);

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "specialtyRadio";
    input.id = id;
    input.hidden = true;

    const chip = document.createElement("label");
    chip.className = "chip";
    chip.htmlFor = id;
    chip.textContent = label;

    input.addEventListener("change", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
      chip.classList.add("chip--active");

      if (isOther) {
        specialtyOtherWrap.classList.remove("hidden");
        specialtyHidden.value = "";
      } else {
        specialtyOtherWrap.classList.add("hidden");
        specialtyOther.value = "";
        specialtyHidden.value = label;
      }
    });

    specialtyOptions.appendChild(input);
    specialtyOptions.appendChild(chip);
  }

  specialtyOther.addEventListener("input", () => {
    specialtyHidden.value = specialtyOther.value.trim();
  });

  /* ----------------- PLAATS ----------------- */
  cityInput.addEventListener("input", () => {
    const q = cityInput.value.toLowerCase();
    citySuggestions.innerHTML = "";
    cityHidden.value = "";

    if (!q) return;

    PLACES.filter(p => p.toLowerCase().startsWith(q)).forEach(place => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = place;
      div.onclick = () => {
        cityInput.value = place;
        cityHidden.value = place;
        citySuggestions.innerHTML = "";
      };
      citySuggestions.appendChild(div);
    });
  });

  /* ----------------- SUBMIT ----------------- */
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    if (!category.value) return showError("Kies een categorie.");
    if (!specialtyHidden.value) return showError("Kies een specialisme.");
    if (!cityHidden.value) return showError("Kies een plaats.");
    if (!nameInput.value.trim()) return showError("Vul je naam in.");
    if (!emailInput.value.trim()) return showError("Vul je e-mailadres in.");

    try {
      const res = await fetch("https://irisje-backend.onrender.com/api/publicRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          category: category.value,
          specialty: specialtyHidden.value,
          city: cityHidden.value
        })
      });

      if (!res.ok) throw new Error(res.status);
      const data = await res.json();

      window.location.href = `/results.html?requestId=${data.request._id}`;

    } catch {
      showError("Er ging iets mis. Probeer het opnieuw.");
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }
});
