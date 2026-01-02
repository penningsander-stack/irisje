// frontend/js/request.js
// v20260102-REQUEST-WIZARD-TRUSTOO-BASE
//
// Aanvraag-wizard (request.html)
// - Werkt met zowel de bestaande 3-staps wizard (category/description/location/contact)
//   als de nieuwe Trustoo-achtige flow (category -> specialty -> context -> message -> contact).
// - Stuurt naar: POST ${API_BASE}/api/publicRequests (FormData)
// - Append-only: voegt category/specialty/context toe indien aanwezig, zonder bestaande velden te breken.

(function () {
  "use strict";

  const API_BASE = "https://irisje-backend.onrender.com";

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("requestWizard") || document.getElementById("requestForm");
    const steps = Array.from(document.querySelectorAll(".wizard-step"));

    // Als er geen wizard-steps zijn, laat deze pagina met rust.
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

    function byId(id) {
      return document.getElementById(id);
    }

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
      if (!statusBox) return;
      statusBox.textContent = msg || "";
    }

    function trimValue(id) {
      const el = byId(id);
      if (!el) return "";
      return String(el.value || "").trim();
    }

    function exists(id) {
      return !!byId(id);
    }

    function needsContext() {
      // Alleen relevant voor de nieuwe flow; als specialty niet bestaat, is context nooit nodig.
      const s = trimValue("specialty");
      return s === "arbeidsrecht" || s === "ontslag-vso";
    }

    function updateHeader() {
      if (stepLabel) stepLabel.textContent = `Stap ${currentStep} van ${totalSteps}`;

      if (!stepTitle) return;

      // Titels per stap (alleen als de nieuwe flow aanwezig is)
      const hasSpecialty = exists("specialty");

      if (!hasSpecialty) {
        // legacy 3-staps wizard
        const titles = {
          1: "Wat heb je nodig?",
          2: "Waar is de klus?",
          3: "Contactgegevens",
        };
        stepTitle.textContent = titles[currentStep] || "";
        return;
      }

      // nieuwe Trustoo-achtige flow
      const titles = {
        1: "Categorie",
        2: "Specialisme",
        3: "Context",
        4: "Toelichting",
        5: "Contactgegevens",
      };

      stepTitle.textContent = titles[currentStep] || "";
    }

    function showStep(stepNumber) {
      const next = Math.min(Math.max(stepNumber, 1), totalSteps);

      steps.forEach((stepEl) => {
        const n = Number(stepEl.dataset.step || "0");
        const isActive = n === next;
        stepEl.classList.toggle("hidden", !isActive);
      });

      currentStep = next;
      setError("");
      updateHeader();

      // Buttons
      if (btnPrev) btnPrev.disabled = currentStep <= 1 || isSubmitting;
      if (btnNext) btnNext.disabled = currentStep >= totalSteps || isSubmitting;
      if (btnSubmit) btnSubmit.disabled = isSubmitting || currentStep !== totalSteps;

      // Als we in de nieuwe flow zitten en context stap zichtbaar is, maar context niet nodig is, springen we door.
      if (exists("specialty") && currentStep === 3 && exists("context") && !needsContext()) {
        // context leegmaken zodat backend niets 'ouds' ontvangt
        byId("context").value = "";
        showStep(4);
      }
    }

    function validateStep(step) {
      // Minimale validatie, per bestaande velden
      // Legacy 3-staps:
      if (!exists("specialty")) {
        if (step === 1) {
          if (!trimValue("category")) return setError("Categorie verplicht."), false;
          if (!trimValue("description")) return setError("Omschrijf je aanvraag."), false;
          return true;
        }
        if (step === 2) {
          if (!trimValue("postcode")) return setError("Postcode verplicht."), false;
          if (!trimValue("city")) return setError("Plaats verplicht."), false;
          return true;
        }
        if (step === 3) {
          const name = trimValue("name");
          const email = trimValue("email");
          if (!name) return setError("Naam verplicht."), false;
          if (!email) return setError("E-mailadres verplicht."), false;
          if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Ongeldig e-mailadres."), false;
          return true;
        }
        return true;
      }

      // Nieuwe Trustoo-achtige flow (5 stappen)
      if (step === 1) {
        // category is vast/hidden of zichtbaar; beide ok, maar moet gevuld zijn.
        let category = trimValue("category");
        if (!category) category = "advocaat";
        if (!category) return setError("Categorie ontbreekt."), false;
        return true;
      }

      if (step === 2) {
        if (!trimValue("specialty")) return setError("Kies een specialisme."), false;
        return true;
      }

      if (step === 3) {
        if (needsContext()) {
          if (!trimValue("context")) return setError("Kies werknemer of werkgever."), false;
        } else {
          if (exists("context")) byId("context").value = "";
        }
        return true;
      }

      if (step === 4) {
        const msg = trimValue("message") || trimValue("description");
        if (!msg) return setError("Licht je aanvraag toe."), false;
        return true;
      }

      if (step === 5) {
        const name = trimValue("name");
        const email = trimValue("email");
        if (!name) return setError("Naam verplicht."), false;
        if (!email) return setError("E-mailadres verplicht."), false;
        if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Ongeldig e-mailadres."), false;
        return true;
      }

      return true;
    }

    function buildFormData() {
      const formData = new FormData();

      // Category: zichtbaar input of hidden
      let category = trimValue("category");
      if (!category) category = "advocaat";
      formData.append("category", category);

      // Nieuwe velden (alleen als ze bestaan)
      if (exists("specialty")) formData.append("specialty", trimValue("specialty"));
      if (exists("context")) formData.append("context", trimValue("context"));

      // Message/description mapping
      const message = trimValue("message") || trimValue("description");
      if (message) formData.append("message", message);

      // Contact
      if (exists("name")) formData.append("name", trimValue("name"));
      if (exists("email")) formData.append("email", trimValue("email"));
      if (exists("phone")) formData.append("phone", trimValue("phone"));

      // Locatie (als aanwezig)
      if (exists("postcode")) formData.append("postcode", trimValue("postcode"));
      if (exists("city")) formData.append("city", trimValue("city"));
      if (exists("street")) formData.append("street", trimValue("street"));
      if (exists("houseNumber")) formData.append("houseNumber", trimValue("houseNumber"));

      // Foto's (optioneel; max 3)
      const photos = byId("photos");
      if (photos && photos.files && photos.files.length) {
        for (let i = 0; i < Math.min(photos.files.length, 3); i++) {
          formData.append("photos", photos.files[i]);
        }
      }

      return formData;
    }

    async function submitWizard(e) {
      e.preventDefault();
      if (isSubmitting) return;

      // Valideer alle stappen tot en met de submit-stap
      for (let s = 1; s <= totalSteps; s++) {
        if (!validateStep(s)) {
          showStep(s);
          return;
        }
      }

      setError("");
      setStatus("Bezig met versturen...");

      isSubmitting = true;
      if (btnPrev) btnPrev.disabled = true;
      if (btnNext) btnNext.disabled = true;
      if (btnSubmit) btnSubmit.disabled = true;

      try {
        const formData = buildFormData();

        const res = await fetch(`${API_BASE}/api/publicRequests`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || !data.ok) {
          setStatus("");
          return setError(data?.message || "Fout bij versturen.");
        }

        const id = data.requestId || data.id || data._id;
        if (!id) {
          setStatus("Verstuurd, maar geen ID ontvangen.");
          return;
        }

        window.location.href = `select-companies.html?requestId=${encodeURIComponent(id)}`;
      } catch (err) {
        console.error("[request wizard] submit failed:", err);
        setStatus("");
        setError("Kan geen verbinding maken met de server.");
      } finally {
        isSubmitting = false;
        if (btnPrev) btnPrev.disabled = currentStep <= 1;
        if (btnNext) btnNext.disabled = currentStep >= totalSteps;
        if (btnSubmit) btnSubmit.disabled = currentStep !== totalSteps;
      }
    }

    if (btnPrev) {
      btnPrev.addEventListener("click", () => showStep(currentStep - 1));
    }

    if (btnNext) {
      btnNext.addEventListener("click", () => {
        if (validateStep(currentStep)) {
          if (exists("specialty") && currentStep === 2 && exists("context") && !needsContext()) {
            byId("context").value = "";
            return showStep(4);
          }
          showStep(currentStep + 1);
        }
      });
    }

    const specialtyEl = byId("specialty");
    if (specialtyEl) {
      specialtyEl.addEventListener("change", () => {
        const ctx = byId("context");
        if (ctx && !needsContext()) ctx.value = "";
      });
    }

    form.addEventListener("submit", submitWizard);

    showStep(1);
  });
})();
