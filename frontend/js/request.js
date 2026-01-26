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
    !form ||
    !categorySelect ||
    !specialtyOptions ||
    !specialtyOtherWrap ||
    !specialtyOtherInput ||
    !cityInput ||
    !cityHidden ||
    !suggestionsBox ||
    !errorBox
  ) {
    console.error("request.js: vereiste form-elementen ontbreken");
    return;
  }

  /* ===============================
     SPECIALISMES PER CATEGORIE
  =============================== */

  const SPECIALTIES = {
    Advocaat: [
      "Arbeidsrecht",
      "Familierecht",
      "Strafrecht",
      "Letselschade",
      "Huurrecht",
      "Bestuursrecht",
      "Anders",
    ],
    Loodgieter: [
      "Lekkage",
      "Verstopping",
      "CV-ketel",
      "Sanitair",
      "Anders",
    ],
    Elektricien: [
      "Storing",
      "Groepenkast",
      "Verlichting",
      "Anders",
    ],
    Schilder: [
      "Binnen",
      "Buiten",
      "Onderhoud",
      "Anders",
    ],
    Hovenier: [
      "Tuinonderhoud",
      "Aanleg",
      "Boomverzorging",
      "Anders",
    ],
  };

  function renderSpecialties(category) {
    specialtyOptions.innerHTML = "";
    specialtyOtherWrap.classList.add("hidden");
    specialtyOtherInput.value = "";

    if (!SPECIALTIES[category]) return;

    SPECIALTIES[category].forEach((spec) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = spec;

      btn.addEventListener("click", () => {
        document
          .querySelectorAll("#specialtyOptions .chip")
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
    renderSpecialties(categorySelect.value);
  });

  /* ===============================
     PLAATS AUTOCOMPLETE
  =============================== */

  const PLACES = [
    "Amsterdam",
    "Rotterdam",
    "Den Haag",
    "Utrecht",
    "Eindhoven",
    "Groningen",
    "Tilburg",
    "Breda",
    "Nijmegen",
    "Apeldoorn",
    "Arnhem",
    "Leiden",
    "Haarlem",
    "Amersfoort",
    "Zwolle",
    "Alkmaar",
    "Almere",
    "Zoetermeer",
    "Dordrecht",
    "Gouda",
  ];

  cityInput.addEventListener("input", () => {
    const q = cityInput.value.toLowerCase();
    suggestionsBox.innerHTML = "";
    cityHidden.value = "";

    if (q.length < 2) return;

    PLACES.filter((c) => c.toLowerCase().includes(q)).forEach((city) => {
      const div = document.createElement("div");
      div.textContent = city;
      div.className = "autocomplete-item";
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

    const category = categorySelect.value;
    const city = cityHidden.value;

    const activeSpec = document.querySelector(
      "#specialtyOptions .chip.active"
    );
    let specialty = activeSpec ? activeSpec.textContent : "";

    if (specialty === "Anders") {
      specialty = specialtyOtherInput.value.trim();
    }

    if (!category || !city || !specialty) {
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
            category,
            city,
            specialty,
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
