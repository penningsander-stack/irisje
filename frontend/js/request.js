// frontend/js/request.js
// v20251211-WIZARD-PUBLICREQUESTS

(function () {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  document.addEventListener("DOMContentLoaded", () => {
    const steps = Array.from(document.querySelectorAll(".wizard-step"));
    if (!steps.length) return;

    const stepLabel = document.getElementById("stepLabel");
    const stepTitle = document.getElementById("stepTitle");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const btnSubmit = document.getElementById("btnSubmit");
    const errorBox = document.getElementById("wizardError");
    const statusBox = document.getElementById("wizardStatus");

    let currentStep = 1;
    const totalSteps = steps.length;
    let isSubmitting = false;

    function setError(msg) {
      if (!errorBox) return;
      if (!msg) {
        errorBox.classList.add("hidden");
        errorBox.textContent = "";
        return;
      }
      errorBox.textContent = msg;
      errorBox.classList.remove("hidden");
    }

    function setStatus(msg) {
      if (statusBox) statusBox.textContent = msg || "";
    }

    function trim(id) {
      const el = document.getElementById(id);
      return el ? (el.value || "").trim() : "";
    }

    function validateStep(step) {
      setError("");

      if (step === 1) {
        const category = trim("category");
        const description = trim("description");
        const photos = document.getElementById("photos");

        if (!category) return setError("Vul een categorie in."), false;
        if (!description) return setError("Beschrijf je klus."), false;

        if (photos && photos.files.length > 3)
          return setError("Maximaal 3 foto's."), false;

        for (let f of photos.files) {
          if (!f.type.startsWith("image/"))
            return setError("Alleen afbeeldingen toegestaan."), false;
        }

        return true;
      }

      if (step === 2) {
        if (!trim("postcode")) return setError("Postcode verplicht."), false;
        if (!trim("city")) return setError("Plaats verplicht."), false;
        return true;
      }

      if (step === 3) {
        const name = trim("name");
        const email = trim("email");

        if (!name) return setError("Naam verplicht."), false;
        if (!email) return setError("E-mailadres verplicht."), false;

        if (!/^\S+@\S+\.\S+$/.test(email))
          return setError("Ongeldig e-mailadres."), false;

        return true;
      }

      return true;
    }

    function showStep(step) {
      currentStep = step;
      steps.forEach((el) => {
        const s = Number(el.dataset.step);
        el.classList.toggle("hidden", s !== step);
      });

      stepLabel.textContent = `Stap ${step} van ${totalSteps}`;

      stepTitle.textContent =
        step === 1 ? "Wat heb je nodig?"
      : step === 2 ? "Waar moet het gebeuren?"
      : "Hoe kunnen we je bereiken?";

      btnPrev.classList.toggle("hidden", step === 1);
      btnNext.classList.toggle("hidden", step === totalSteps);
      btnSubmit.classList.toggle("hidden", step !== totalSteps);

      setError("");
      setStatus("");
    }

    async function submit() {
      if (isSubmitting) return;
      if (!validateStep(3)) return;

      const formData = new FormData();

      // verplichte velden
      formData.append("name", trim("name"));
      formData.append("email", trim("email"));
      formData.append("message", trim("description"));

      // extra
      formData.append("category", trim("category"));
      formData.append("city", trim("city"));
      formData.append("postcode", trim("postcode"));
      formData.append("street", trim("street"));
      formData.append("houseNumber", trim("houseNumber"));
      formData.append("phone", trim("phone"));

      const photos = document.getElementById("photos");
      for (let i = 0; i < Math.min(photos.files.length, 3); i++) {
        formData.append("photos", photos.files[i]);
      }

      isSubmitting = true;
      btnPrev.disabled = btnNext.disabled = btnSubmit.disabled = true;
      setStatus("Bezig met versturen...");

      try {
        const res = await fetch(`${API_BASE}/api/publicRequests`, {
          method: "POST",
          body: formData
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.ok) {
          return setError(data?.message || "Fout bij versturen."), setStatus("");
        }

        const id = data.requestId;
        if (!id) return setStatus("Verstuurd, maar geen ID ontvangen.");

        window.location.href = `select-companies.html?requestId=${encodeURIComponent(id)}`;

      } catch (err) {
        console.error(err);
        setError("Kan geen verbinding maken met de server.");
        setStatus("");
      } finally {
        isSubmitting = false;
        btnPrev.disabled = btnNext.disabled = btnSubmit.disabled = false;
      }
    }

    // Events
    btnPrev.addEventListener("click", () => showStep(currentStep - 1));
    btnNext.addEventListener("click", () => {
      if (validateStep(currentStep)) showStep(currentStep + 1);
    });
    btnSubmit.addEventListener("click", submit);

    // Init
    showStep(1);
  });
})();
