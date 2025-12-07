// frontend/js/login.js
// v20251206-AUTH-CLEAN
//
// Verantwoordelijk voor:
// - Inlogformulier afhandelen
// - Opslaan van token, rol en e-mail in localStorage
// - Doorsturen naar dashboard of admin als iemand al is ingelogd

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";
  const LOGIN_ENDPOINT = API_BASE + "/auth/login";

  function $(id) {
    return document.getElementById(id);
  }

  function showMessage(msg, isError) {
    const box = $("loginMessage");
    if (!box) return;
    box.textContent = msg || "";
    box.className =
      "text-center text-sm mt-2 " +
      (isError ? "text-red-600" : "text-green-600");
  }

  function setLoading(isLoading) {
    const form = $("loginForm");
    if (!form) return;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading
      ? "Bezig met inloggen..."
      : "Inloggen";
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = $("loginForm");
    const emailInput = $("email");
    const passwordInput = $("password");

    if (!form || !emailInput || !passwordInput) {
      console.warn("[login] Ontbrekende elementen in login.html");
      return;
    }

    // Als er al een sessie lijkt te zijn → direct doorsturen
    const existingToken = localStorage.getItem("token");
    const existingRole = localStorage.getItem("userRole");

    if (existingToken && existingRole) {
      if (existingRole === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
      return;
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) {
        showMessage("Vul je e-mailadres en wachtwoord in.", true);
        return;
      }

      setLoading(true);
      showMessage("", false);

      try {
        const res = await fetch(LOGIN_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(function () {
          return {};
        });

        if (!res.ok || !data || !data.token) {
          const msg =
            (data && (data.message || data.error)) ||
            "Inloggen mislukt. Controleer je gegevens.";
          throw new Error(msg);
        }

        const role = data.role || "company";
        const companyId = data.companyId || null;
        const emailFromServer = data.email || email;

        try {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userRole", role);
          localStorage.setItem("userEmail", emailFromServer);
          if (companyId) {
            localStorage.setItem("companyId", String(companyId));
          }
        } catch (storageErr) {
          console.warn(
            "[login] Kon gegevens niet opslaan in localStorage:",
            storageErr
          );
        }

        showMessage("Succesvol ingelogd, een moment...", false);

        if (role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      } catch (err) {
        console.error("[login] Fout bij inloggen:", err);
        showMessage(
          err.message || "Inloggen mislukt. Probeer het later opnieuw.",
          true
        );
      } finally {
        setLoading(false);
      }
    });
  });
})();
