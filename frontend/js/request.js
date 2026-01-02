// frontend/js/request.js
// v20260102-REQUEST-WIZARD-CLEAN
//
// ✔ Eén wizard
// ✔ Publieke endpoint: /api/publicRequests
// ✔ Geen token nodig
// ✔ Submit-knop alleen op laatste stap

(function () {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  document.addEventListener("DOMContentLoaded", () => {
    const form =
      document.getElementById("requestWizard") ||
      document.getElementById("requestForm");
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
    const val = (id) => (byId(id)?.value || "").trim();

    function setError(msg) {
      if (!errorBox) return;
      errorBox.textContent = msg || "";
      errorBox.classList.toggle("hidden", !msg);
    }

    function setStatus(msg) {
      if (statusBox) statusBox.textContent = msg || "";
    }

    function needsContext() {
      const s = val("specialty");
      return s === "arbeidsrecht" || s === "ontslag-vso";
    }

    function updateHeader() {
      if (stepLabel)
        stepLabel.textContent = `Stap ${currentStep} van ${totalSteps}`;
      if (!stepTitle) return;

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

      btnPrev && (btnPrev.disabled = currentStep <= 1 || isSubmitting);
      btnNext &&
        btnNext.classList.toggle("hidden", isLast);
      btnSubmit &&
        btnSubmit.classList.toggle("hidden", !isLast);

      btnNext && (btnNext.disabled = isSubmitting);
      btnSubmit && (btnSubmit.disabled = isSubmitting);
    }

    function showStep(n) {
      const next = Math.min(Math.max(n, 1), totalSteps);
      steps.forEach((el) => {
        el.classList.toggle(
          "hidden",
          Number(el.dataset.step) !== next
        );
      });
      currentStep = next;
      setError("");
      updateHeader();
      updateButtons();

      if (exists("context") && currentStep === 3 && !needsContext()) {
        byId("context").value = "";
        showStep(4);
      }
    }

    function validateStep(step) {
      if (step === 2 && !val("specialty"))
        return setError("Kies een specialisme."), false;

      if (step === 3 && needsContext() && !val("context"))
        return setError("Kies werknemer of werkgever."), false;

      if (step === 4 && !val("message"))
        return setError("Licht je aanvraag toe."), false;

      if (step === 5) {
        if (!val("name")) return setError("Naam verplicht."), false;
        if (!val("email")) return setError("E-mailadres verplicht."), false;
      }
      return true;
    }

    function buildPayload() {
      return {
        category: val("category") || "advocaat",
        specialty: val("specialty"),
        context: val("context"),
        message: val("message"),
        name: val("name"),
        email: val("email"),
      };
    }

    async function submitWizard(e) {
      e.preventDefault();
      if (isSubmitting) return;

      for (let i = 1; i <= totalSteps; i++) {
        if (!validateStep(i)) {
          showStep(i);
          return;
        }
      }

      isSubmitting = true;
      updateButtons();
      setStatus("Bezig met versturen…");

      try {
        const res = await fetch(`${API_BASE}/api/publicRequests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });

        const data = await res.json();
        if (!res.ok || !data?.ok)
          throw new Error(data?.error || "Aanvraag mislukt.");

        const id = data.requestId || data._id;
        window.location.href =
          "select-companies.html?requestId=" +
          encodeURIComponent(id);
      } catch (err) {
        setStatus("");
        setError(err.message || "Kan aanvraag niet versturen.");
      } finally {
        isSubmitting = false;
        updateButtons();
      }
    }

    btnPrev?.addEventListener("click", () => showStep(currentStep - 1));
    btnNext?.addEventListener("click", () =>
      validateStep(currentStep) && showStep(currentStep + 1)
    );
    form.addEventListener("submit", submitWizard);

    showStep(1);
  });
})();
