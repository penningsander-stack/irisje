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

  // ❗ NOOIT meer het script stoppen
  if (!form || !categorySelect) {
    console.warn("request.js: basisformulier niet gevonden");
    return;
  }

  /* ===============================
     SPECIALISMES
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
    elektricien: ["Storing", "Groepenkast", "Verlichting", "Anders"],
    schilder: ["Binnen", "Buiten", "Onderhoud", "Anders"],
    hovenier: ["Tuinonderhoud", "Aanleg", "Boomverzorging", "Anders"],
  };

  function renderSpecialties(categoryValue) {
    if (!specialtyOptions) return;

    specialtyOptions.innerHTML = "";

    if (specialtyOtherWrap) specialtyOtherWrap.classList.add("hidden");
    if (specialtyOtherInput) specialtyOtherInput.value = "";

    const list = SPECIALTIES[categoryValue?.toLowerCase()];
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

        if (spec === "Anders" && specialtyOtherWrap) {
          specialtyOtherWrap.classList.remove("hidden");
        } else if (specialtyOtherWrap && specialtyOtherInput) {
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
    "Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven",
    "Groningen","Tilburg","Breda","Nijmegen","Apeldoorn",
    "Arnhem","Leiden","Haarlem","Amersfoort","Zwolle",
    "Alkmaar","Almere","Zoetermeer","Dordrecht","Gouda"
  ];

  if (cityInput && suggestionsBox && cityHidden) {
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
  }

  /* ===============================
     SUBMIT
  =============================== */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (errorBox) {
      errorBox.textContent = "";
      errorBox.classList.add("hidden");
    }

    const name = nameInput?.value?.trim();
    const email = emailInput?.value?.trim();
    const category = categorySelect.value;
    const city = cityHidden?.value;

    const activeChip = specialtyOptions?.querySelector(".chip.active");
    let specialty = activeChip ? activeChip.textContent : "";

    if (specialty === "Anders") {
      specialty = specialtyOtherInput?.value?.trim();
    }

    if (!name || !email || !category || !city || !specialty) {
      if (errorBox) {
        errorBox.textContent = "Vul alle stappen volledig in.";
        errorBox.classList.remove("hidden");
      }
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
      if (errorBox) {
        errorBox.textContent = err.message;
        errorBox.classList.remove("hidden");
      }
    }
  });
});
