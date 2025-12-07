// frontend/js/register.js
// v20251206-AUTH-CLEAN
//
// Verantwoordelijk voor:
// - Bedrijfsregistratieformulier
// - Validatie van invoer
// - Aanroepen van de /auth/register endpoint
// - Gebruiker na succes terugsturen naar login.html

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";
  const REGISTER_ENDPOINT = API_BASE + "/auth/register";

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(msg, isError) {
    const box = $("registerMessage");
    if (!box) return;
    box.textContent = msg || "";
    box.classList.remove("hidden");
    box.className =
      "mt-4 text-sm " + (isError ? "text-red-600" : "text-green-600");
  }

  function setLoading(isLoading) {
    const form = $("registerForm");
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading
      ? "Account wordt aangemaakt..."
      : "Account aanmaken";
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = $("registerForm");
    if (!form) {
      console.warn("[register] registerForm niet gevonden in register.html");
      return;
    }

    const nameInput = $("name");
    const cityInput = $("city");
    const categoryInput = $("category");
    const emailInput = $("email");
    const passwordInput = $("password");
    const confirmPasswordInput = $("confirmPassword");
    const termsInput = $("terms");

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = nameInput && nameInput.value.trim();
      const city = cityInput && cityInput.value.trim();
      const category = categoryInput && categoryInput.value.trim();
      const email = emailInput && emailInput.value.trim();
      const password = passwordInput && passwordInput.value.trim();
      const confirmPassword =
        confirmPasswordInput && confirmPasswordInput.value.trim();
      const termsChecked = termsInput && termsInput.checked;

      if (!name || !city || !category || !email || !password || !confirmPassword) {
        showMessage("Vul alle verplichte velden in.", true);
        return;
      }

      if (password.length < 6) {
        showMessage("Het wachtwoord moet minimaal 6 tekens bevatten.", true);
        return;
      }

      if (password !== confirmPassword) {
        showMessage("De wachtwoorden komen niet overeen.", true);
        return;
      }

      if (!termsChecked) {
        showMessage("Je moet akkoord gaan met de voorwaarden.", true);
        return;
      }

      setLoading(true);
      showMessage("", false);

      try {
        const res = await fetch(REGISTER_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            city: city,
            category: category,
            email: email,
            password: password,
          }),
        });

        const data = await res.json().catch(function () {
          return {};
        });

        if (!res.ok) {
          const msg =
            (data && (data.message || data.error)) ||
            "Registratie mislukt. Probeer het later opnieuw.";
          throw new Error(msg);
        }

        showMessage(
          "Account succesvol aangemaakt. Je kunt nu inloggen.",
          false
        );

        // Klein moment laten staan en dan naar login
        setTimeout(function () {
          window.location.href = "login.html";
        }, 1500);
      } catch (err) {
        console.error("[register] Fout bij registreren:", err);
        showMessage(
          err.message || "Registratie mislukt. Probeer het later opnieuw.",
          true
        );
      } finally {
        setLoading(false);
      }
    });
  });
})();
