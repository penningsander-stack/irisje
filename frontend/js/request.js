// frontend/js/request.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  const categorySelect = document.getElementById("category");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");

  const specialtyOptions = document.getElementById("specialtyOptions");
  const specialtyOtherWrap = document.getElementById("specialtyOtherWrap");
  const specialtyOtherInput = document.getElementById("specialtyOther");

  const cityInput = document.getElementById("cityInput");
  const cityHidden = document.getElementById("city");
  const suggestionsBox = document.getElementById("citySuggestions");
  const errorBox = document.getElementById("formError");

  if (
    !form || !categorySelect || !nameInput || !emailInput ||
    !specialtyOptions || !specialtyOtherWrap || !specialtyOtherInput ||
    !cityInput || !cityHidden || !suggestionsBox || !errorBox
  ) {
    console.error("request.js: vereiste form-elementen ontbreken");
    return;
  }

  /* ===============================
     SPECIALISMES (LOWERCASE KEYS)
  =============================== */

  const SPECIALTIES = {
    advocaat: [
      "Arbeidsrecht",
      "Familierecht",
      "Strafrecht",
      "Letselschade",
      "Huurrecht",
      "Bestuursrecht",
      "Anders",
    ],
    loodgieter: [
      "Lekkage",
      "Verstopping",
      "CV-ketel",
      "Sanitair",
      "Anders",
    ],
    elektricien: [
      "Storing",
      "Groepenkast",
      "Verlichting",
      "Anders",
    ],
    schilder: [
      "Binnen",
      "Buiten",
      "Onderhoud",
      "Anders",
    ],
    hovenier: [
      "Tuinonderhoud",
      "Aanleg",
      "Boomverzorging",
      "Anders",
    ],
  };

  function renderSpecialties(categoryValue) {
    specialtyOptions.innerHTML = "";
    specialtyOtherWrap.classList.add("hidden");
    specialtyOtherInput.value = "";

    const list = SPECIALTIES[categoryValue];
    if (!list) return;

    list.forEach((spec) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = spec;

      btn.addEventListener("click", () => {
        specialtyOptions
          .querySelectorAll(".chip")
          .forEach((b) => b.classList.remove("active"));

        btn.classList.add("active");

        if (spec === "Anders") {
          specialtyOtherWrap.classList.remove("hidden");
        } else {
          specialtyOtherWrap.classList.add("hidden");
          specialtyOtherInput.value = "";
        }
      });

      specialtyOptions.appendChild(btn);
    });
  }

  categorySelect.addEventListener("change", () => {
    renderSpecialties(categorySelect.value); // ⬅️ lowercase value
  });

  /* ===============================
     PLAATS AUTOCOMPLETE
  =============================== */

  const PLACES = [
    "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven",
    "Groningen","Tilburg","Breda","Nijmegen","Apeldoorn",
    "Arnhem","Leiden","Haarlem","Amersfoort","Zwolle",
    "Alkmaar","Almere","Zoetermeer","Dordrecht","Gouda"
  ];

  cityInput.addEventListener("input", () => {
    const q = cityInput.value.toLowerCase();
    suggestionsBox.innerHTML = "";
    cityHidden.value = "";

    if (q.length < 2) return;

    PLACES.filter((c) => c.toLowerCase().includes(q)).forEach((city) => {
      const div = document.createElement("div");
      div.className = "autocomplete-item";
      div.textContent = city;
      div.addEventListener("click", () => {
        cityInput.value = city;
        cityHidden.value = city;
        suggestionsBox.innerHTML = "";
      });
      suggestionsBox.appendChild(div);
    });
  });

  /* ===============================
     SUBMIT
  =============================== */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    errorBox.textContent = "";

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const category = categorySelect.value;
    const city = cityHidden.value;

    const activeChip = specialtyOptions.querySelector(".chip.active");
    let specialty = activeChip ? activeChip.textContent : "";

    if (specialty === "Anders") {
      specialty = specialtyOtherInput.value.trim();
    }

    if (!name || !email || !category || !city || !specialty) {
      errorBox.textContent = "Vul alle stappen volledig in.";
      errorBox.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            category,
            specialty,
            city,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Aanvraag mislukt");
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    }
  });
});
