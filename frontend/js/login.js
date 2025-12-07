// frontend/js/login.js
// v20251206-PREMIUM

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";
  const LOGIN_ENDPOINT = API_BASE + "/auth/login";

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(msg, isError) {
    const el = $("loginStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "rq-status " + (isError ? "text-red-600" : "text-green-600");
  }

  function addValidation(input, validator, errorEl) {
    input.addEventListener("input", () => {
      const valid = validator(input.value);
      if (valid === true) {
        input.classList.remove("error-border");
        errorEl.classList.add("hidden");
        errorEl.textContent = "";
      } else {
        input.classList.add("error-border");
        errorEl.classList.remove("hidden");
        errorEl.textContent = valid;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = $("loginForm");
    if (!form) return;

    const emailEl = $("email");
    const passEl = $("password");
    const errEmail = $("errEmail");
    const errPass = $("errPassword");

    const validators = {
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Ongeldig e-mailadres.",
      password: (v) => v.trim().length >= 4 || "Wachtwoord moet minimaal 4 tekens hebben."
    };

    addValidation(emailEl, validators.email, errEmail);
    addValidation(passEl, validators.password, errPass);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showMessage("");

      const vEmail = validators.email(emailEl.value);
      const vPass = validators.password(passEl.value);

      if (vEmail !== true || vPass !== true) {
        if (vEmail !== true) errEmail.textContent = vEmail;
        if (vPass !== true) errPass.textContent = vPass;
        showMessage("❌ Controleer de invoer.", true);
        return;
      }

      try {
        showMessage("⏳ Inloggen...", false);

        const res = await fetch(LOGIN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailEl.value.trim(),
            password: passEl.value.trim()
          })
        });

        const json = await res.json();

        if (!res.ok || !json.token) {
          throw new Error(json.error || "Login mislukt");
        }

        localStorage.setItem("token", json.token);
        window.location.href = "dashboard.html";

      } catch (err) {
        console.error("[login] fout:", err);
        showMessage("❌ Ongeldige inloggegevens.", true);
      }
    });
  });
})();
