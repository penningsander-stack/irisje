// frontend/js/request.js
// v20251211-REQUEST-WIZARD
//
// 3-staps offertewizard voor Irisje.nl
// Stuurt data naar: POST /api/requests (backend)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initRequestWizard();
});

function initRequestWizard() {
  const steps = Array.from(document.querySelectorAll(".wizard-step"));
  if (!steps.length) return;

  let currentStep = 1;
  const maxStep = 3;

  const stepLabel = document.getElementById("stepLabel");
  const stepTitle = document.getElementById("stepTitle");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnSubmit = document.getElementById("btnSubmit");
  const errorBox = document.getElementById("wizardError");
  const statusBox = document.getElementById("wizardStatus");

  // Inputs
  const categoryInput = document.getElementById("category");
  const descriptionInput = document.getElementById("description");
  const photosInput = document.getElementById("photos");

  const postcodeInput = document.getElementById("postcode");
  const cityInput = document.getElementById("city");
  const streetInput = document.getElementById("street");
  const houseNumberInput = document.getElementById("houseNumber");

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  // Prefill vanuit URL (category, city)
  try {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const city = params.get("city");

    if (cat && categoryInput) categoryInput.value = cat;
    if (city && cityInput) cityInput.value = city;
  } catch (err) {
    console.warn("Kon querystring niet parsen:", err);
  }

  function showStep(step) {
    currentStep = step;

    steps.forEach((el) => {
      const s = Number(el.getAttribute("data-step"));
      if (s === step) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    });

    if (stepLabel) stepLabel.textContent = `Stap ${step} van 3`;

    if (stepTitle) {
      if (step === 1) stepTitle.textContent = "Wat heb je nodig?";
      else if (step === 2) stepTitle.textContent = "Waar moet het gebeuren?";
      else stepTitle.textContent = "Hoe kunnen bedrijven jou bereiken?";
    }

    if (btnPrev) {
      btnPrev.disabled = step === 1;
      btnPrev.classList.toggle("opacity-50", step === 1);
    }

    if (btnNext && btnSubmit) {
      if (step < maxStep) {
        btnNext.classList.remove("hidden");
        btnSubmit.classList.add("hidden");
      } else {
        btnNext.classList.add("hidden");
        btnSubmit.classList.remove("hidden");
      }
    }

    hideError();
  }

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }

  function setStatus(msg) {
    if (!statusBox) return;
    statusBox.textContent = msg || "";
  }

  function validateStep(step) {
    hideError();

    if (step === 1) {
      const cat = (categoryInput?.value || "").trim();
      const desc = (descriptionInput?.value || "").trim();

      if (!cat) {
        showError("Vul een categorie in, bijvoorbeeld 'schilder' of 'loodgieter'.");
        return false;
      }
      if (!desc) {
        showError("Beschrijf kort wat er moet gebeuren.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      const pc = (postcodeInput?.value || "").trim();
      const city = (cityInput?.value || "").trim();

      if (!pc || !city) {
        showError("Vul in ieder geval je postcode en plaats in.");
        return false;
      }
      return true;
    }

    if (step === 3) {
      const name = (nameInput?.value || "").trim();
      const email = (emailInput?.value || "").trim();

      if (!name) {
        showError("Vul je naam in.");
        return false;
      }
      if (!email || !email.includes("@") || !email.includes(".")) {
        showError("Vul een geldig e-mailadres in.");
        return false;
      }
      return true;
    }

    return true;
  }

  async function handleSubmit() {
    if (!validateStep(3)) return;

    hideError();
    setStatus("Bezig met versturen van je aanvraag…");

    const cat = (categoryInput?.value || "").trim();
    const desc = (descriptionInput?.value || "").trim();

    const pc = (postcodeInput?.value || "").trim();
    const city = (cityInput?.value || "").trim();
    const street = (streetInput?.value || "").trim();
    const hn = (houseNumberInput?.value || "").trim();

    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const phone = (phoneInput?.value || "").trim();

    // Foto-info toevoegen aan message (backend ondersteunt nog geen echte uploads)
    let photoInfo = "";
    if (photosInput && photosInput.files && photosInput.files.length > 0) {
      const files = Array.from(photosInput.files).slice(0, 3);
      const names = files.map((f) => f.name).join(", ");
      photoInfo = `\n\nFoto's meegestuurd (nog niet als bestand opgeslagen): ${files.length} bestand(en): ${names}`;
    }

    const message = `${desc}${photoInfo}`;

    const payload = {
      name,
      email,
      city,
      message,
      category: cat,
      // extra velden volgens bestaand Request-model
      specialty: "",
      communication: "",
      experience: "",
      approach: "",
      involvement: "",
      // optioneel extra info via message of later uit te breiden in backend
      postcode: pc,
      street,
      houseNumber: hn,
      phone
    };

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Fout bij aanvragen:", res.status, text);
        showError("Er ging iets mis bij het versturen van je aanvraag. Probeer het later opnieuw.");
        setStatus("");
        return;
      }

      const data = await res.json();
      if (!data || data.ok !== true) {
        console.error("Onverwachte response:", data);
        showError("Je aanvraag kon niet worden opgeslagen. Probeer het later opnieuw.");
        setStatus("");
        return;
      }

      // Succes → doorsturen naar bevestigingspagina
      window.location.href = "success.html";
    } catch (err) {
      console.error("Netwerkfout bij versturen aanvraag:", err);
      showError("Er trad een netwerkfout op. Controleer je verbinding en probeer opnieuw.");
      setStatus("");
    }
  }

  // Events
  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (!validateStep(currentStep)) return;
      if (currentStep < maxStep) {
        showStep(currentStep + 1);
      }
    });
  }

  if (btnSubmit) {
    btnSubmit.addEventListener("click", () => {
      handleSubmit();
    });
  }

  // Start op stap 1
  showStep(1);
}
