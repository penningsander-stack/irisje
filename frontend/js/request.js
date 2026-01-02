// frontend/js/request.js
// v20260102-REQUEST-WIZARD-13H
//
// FIX: submit-knop correct tonen op laatste stap
// - btnSubmit zichtbaar bij step === totalSteps
// - btnNext verborgen bij step === totalSteps

(function () {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("requestWizard") || document.getElementById("requestForm");
    const steps = Array.from(document.querySelectorAll(".wizard-step"));
    if (!form || !steps.length) return;

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

    const byId = (id) => document.getElementById(id);
    const exists = (id) => !!byId(id);
    const trimValue = (id) => (byId(id)?.value || "").trim();

    function setError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg || "";
      errorBox.classList.toggle("hidden", !msg);
    }

    function setStatus(msg) {
      if (statusBox) statusBox.textContent = msg || "";
    }

    function needsContext() {
      const s = trimValue("specialty");
      return s === "arbeidsrecht" || s === "ontslag-vso";
    }

    function updateHeader() {
      if (stepLabel) stepLabel.textContent = `Stap ${currentStep} van ${totalSteps}`;
      if (!stepTitle) return;

      if (!exists("specialty")) {
        const legacy = { 1: "Wat heb je nodig?", 2: "Waar is de klus?", 3: "Contactgegevens" };
        stepTitle.textContent = legacy[currentStep] || "";
        return;
      }

      const titles = {
        1: "Categorie",
        2: "Specialisme",
        3: "Context",
        4: "Toelichting",
        5: "Contactgegevens",
      };
      stepTitle.textContent = titles[currentStep] || "";
    }

    function updateButtons() {
      const isLast = currentStep === totalSteps;

      if (btnPrev) btnPrev.disabled = currentStep <= 1 || isSubmitting;

      if (btnNext) {
        btnNext.classList.toggle("hidden", isLast);
        btnNext.disabled = isSubmitting;
      }

      if (btnSubmit) {
        btnSubmit.classList.toggle("hidden", !isLast);
        btnSubmit.disabled = isSubmitting;
      }
    }

    function showStep(stepNumber) {
      const next = Math.min(Math.max(stepNumber, 1), totalSteps);

      steps.forEach((el) => {
        const n = Number(el.dataset.step || "0");
        el.classList.toggle("hidden", n !== next);
      });

      currentStep = next;
      setError("");
      updateHeader();
      updateButtons();

      if (exists("specialty") && currentStep === 3 && exists("context") && !needsContext()) {
        byId("context").value = "";
        showStep(4);
      }
    }

    function validateStep(step) {
      if (!exists("specialty")) {
        if (step === 1) {
          if (!trimValue("category")) return setError("Categorie verplicht."), false;
          if (!trimValue("description")) return setError("Omschrijf je aanvraag."), false;
        }
        if (step === 2) {
          if (!trimValue("postcode")) return setError("Postcode verplicht."), false;
          if (!trimValue("city")) return setError("Plaats verplicht."), false;
        }
        if (step === 3) {
          if (!trimValue("name")) return setError("Naam verplicht."), false;
          if (!trimValue("email")) return setError("E-mailadres verplicht."), false;
        }
        return true;
      }

      if (step === 2 && !trimValue("specialty")) return setError("Kies een specialisme."), false;
      if (step === 3 && needsContext() && !trimValue("context"))
        return setError("Kies werknemer of werkgever."), false;
      if (step === 4 && !(trimValue("message") || trimValue("description")))
        return setError("Licht je aanvraag toe."), false;
      if (step === 5) {
        if (!trimValue("name")) return setError("Naam verplicht."), false;
        if (!trimValue("email")) return setError("E-mailadres verplicht."), false;
      }
      return true;
    }

    function buildFormData() {
      const fd = new FormData();
      fd.append("category", trimValue("category") || "advocaat");
      if (exists("specialty")) fd.append("specialty", trimValue("specialty"));
      if (exists("context")) fd.append("context", trimValue("context"));
      fd.append("message", trimValue("message") || trimValue("description"));
      fd.append("name", trimValue("name"));
      fd.append("email", trimValue("email"));
      return fd;
    }

    async function submitWizard(e) {
      e.preventDefault();
      if (isSubmitting) return;

      for (let s = 1; s <= totalSteps; s++) {
        if (!validateStep(s)) {
          showStep(s);
          return;
        }
      }

      isSubmitting = true;
      updateButtons();
      setStatus("Bezig met versturen...");

      try {
        const res = await fetch(`${API_BASE}/api/requests`, {
          method: "POST",
          body: buildFormData(),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.message || "Fout");

        const id = data.requestId || data.id || data._id;
        window.location.href = `select-companies.html?requestId=${encodeURIComponent(id)}`;
      } catch (err) {
        setStatus("");
        setError("Kan aanvraag niet versturen.");
      } finally {
        isSubmitting = false;
        updateButtons();
      }
    }

    btnPrev?.addEventListener("click", () => showStep(currentStep - 1));
    btnNext?.addEventListener("click", () => validateStep(currentStep) && showStep(currentStep + 1));
    byId("specialty")?.addEventListener("change", () => !needsContext() && exists("context") && (byId("context").value = ""));
    form.addEventListener("submit", submitWizard);

    showStep(1);
  });
})();
