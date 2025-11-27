// frontend/js/register.js
// v20251127-JWT-REGISTER
// Maakt een nieuw account aan via /api/auth/register.

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, text, extraClass) {
    if (!el) return;
    el.textContent = text || "";
    if (typeof extraClass === "string") {
      el.className = extraClass;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = byId("registerForm");
    if (!form) return;

    const nameEl = byId("name");
    const emailEl = byId("email");
    const passwordEl = byId("password");
    const passwordConfirmEl = byId("passwordConfirm");

    const errNameEl = byId("errName");
    const errEmailEl = byId("errEmail");
    const errPasswordEl = byId("errPassword");
    const errPasswordConfirmEl = byId("errPasswordConfirm");
    const statusEl = byId("registerStatus");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Reset foutmeldingen
      setText(errNameEl, "");
      setText(errEmailEl, "");
      setText(errPasswordEl, "");
      setText(errPasswordConfirmEl, "");
      setText(statusEl, "");

      const name = (nameEl?.value || "").trim();
      const email = (emailEl?.value || "").trim();
      const password = (passwordEl?.value || "").trim();
      const passwordConfirm = (passwordConfirmEl?.value || "").trim();

      let hasError = false;

      if (!name) {
        setText(errNameEl, "Naam is verplicht.", "error");
        hasError = true;
      }

      if (!email) {
        setText(errEmailEl, "E-mailadres is verplicht.", "error");
        hasError = true;
      } else if (!email.includes("@")) {
        setText(errEmailEl, "Vul een geldig e-mailadres in.", "error");
        hasError = true;
      }

      if (!password) {
        setText(errPasswordEl, "Wachtwoord is verplicht.", "error");
        hasError = true;
      } else if (password.length < 8) {
        setText(
          errPasswordEl,
          "Wachtwoord moet minimaal 8 tekens lang zijn.",
          "error"
        );
        hasError = true;
      }

      if (!passwordConfirm) {
        setText(
          errPasswordConfirmEl,
          "Bevestig je wachtwoord.",
          "error"
        );
        hasError = true;
      } else if (password && passwordConfirm && password !== passwordConfirm) {
        setText(
          errPasswordConfirmEl,
          "Wachtwoorden komen niet overeen.",
          "error"
        );
        hasError = true;
      }

      if (hasError) return;

      setText(statusEl, "Account wordt aangemaakt…", "info");

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok === false) {
          const msg =
            (data && (data.error || data.message)) ||
            (res.status === 400
              ? "De gegevens zijn niet volledig of ongeldig."
              : `Registratie mislukt (status ${res.status}).`);
          setText(statusEl, msg, "error");
          return;
        }

        setText(
          statusEl,
          "Je account is aangemaakt. Je kunt nu inloggen.",
          "success"
        );

        // Na korte vertraging naar loginpagina
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1200);
      } catch (err) {
        console.error("Register error:", err);
        setText(
          statusEl,
          "Er is een fout opgetreden bij het aanmaken van je account. Probeer het later opnieuw.",
          "error"
        );
      }
    });
  });
})();
