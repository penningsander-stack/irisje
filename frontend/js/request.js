// frontend/js/request.js
// Aanvraag starten (FASE 1) via /api/publicRequests — specialismen behouden

document.addEventListener("DOMContentLoaded", () => {
  // ====================
  // A8: preselectie-context opslaan
  // ====================
  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");
  if (companySlug) {
    sessionStorage.setItem("preselectedCompanySlug", companySlug);
  }

  const PLACES = [
    "Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven",
    "Groningen", "Leeuwarden", "Zwolle", "Arnhem", "Nijmegen",
    "Breda", "Tilburg", "Haarlem", "Alkmaar", "Amersfoort",
    "Apeldoorn", "Leiden", "Dordrecht", "Gouda", "Middelburg",
    "Burgh-Haamstede"
  ];

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

  let selectedSpecialty = "";

  function renderSpecialties() {
    const sectorKey = normalize(categorySelect.value);
    specialtyOptions.innerHTML = "";
    specialtyOtherWrap.classList.add("hidden");
    specialtyOtherInput.value = "";
    selectedSpecialty = "";

    if (!sectorKey) return;

    const list = SPECIALTIES_BY_SECTOR[sectorKey] || [];

    list.forEach(label => {
      specialtyOptions.appendChild(createChip(label, false));
    });

    specialtyOptions.appendChild(createChip("Anders", true));
  }

  function createChip(label, isOther) {
    const id = `spec_${Math.random().toString(16).slice(2)}`;
    const wrapper = document.createElement("div");

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "specialty";
    input.id = id;
    input.className = "sr-only";

    const chip = document.createElement("label");
    chip.setAttribute("for", id);
    chip.className = "chip";
    chip.textContent = label;

    input.addEventListener("change", () => {
      [...specialtyOptions.querySelectorAll(".chip")].forEach(c =>
        c.classList.remove("chip--active")
      );
      chip.classList.add("chip--active");

      if (isOther) {
        specialtyOtherWrap.classList.remove("hidden");
        selectedSpecialty = "";
        setTimeout(() => specialtyOtherInput.focus(), 0);
      } else {
        specialtyOtherWrap.classList.add("hidden");
        specialtyOtherInput.value = "";
        selectedSpecialty = label;
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(chip);
    return wrapper;
  }

  specialtyOtherInput.addEventListener("input", () => {
    selectedSpecialty = specialtyOtherInput.value.trim();
  });

  categorySelect.addEventListener("change", renderSpecialties);

  cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";
    cityHidden.value = "";

    if (!query) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = PLACES.filter(p => p.toLowerCase().startsWith(query));

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

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    const sector = categorySelect.value.trim();
    const city = cityHidden.value.trim();
    const specialty = selectedSpecialty.trim();

    if (!sector) return showError("Kies een categorie.");
    if (!specialty) return showError("Kies een specialisme.");
    if (!city) return showError("Kies een plaats uit de lijst.");

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/publicRequests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ sector, specialty, city })
        }
      );

      if (!res.ok) throw new Error(res.status);

      const data = await res.json();
      const requestId = data?.request?._id || data?.requestId;
      if (!requestId) throw new Error("Geen requestId ontvangen");

      // ✅ FIX: behoud context in de URL voor results.html
      const out = new URLSearchParams();
      out.set("requestId", requestId);
      out.set("category", sector);
      out.set("city", city);
      out.set("specialty", specialty);

      const storedSlug = sessionStorage.getItem("preselectedCompanySlug");
      if (storedSlug) out.set("companySlug", storedSlug);

      window.location.href = `/results.html?${out.toString()}`;
    } catch (err) {
      console.error(err);
      showError("Er ging iets mis bij het starten van je aanvraag.");
    }
  });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function normalize(v) {
    return String(v || "").toLowerCase().trim();
  }
});
