// frontend/js/login.js
// v20251127-JWT-LOGIN
// Inloggen via JWT (geen cookies). Slaat token + rol + companyId op in localStorage.

(() => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(el, text, extraClass = "") {
    if (!el) return;
    el.textContent = text || "";
    el.className = extraClass || "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = byId("loginForm");
    const emailEl = byId("email");
    const passwordEl = byId("password");
    const errEmailEl = byId("errEmail");
    const errPasswordEl = byId("errPassword");
    const statusEl = byId("loginStatus");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Reset foutmeldingen
      setText(errEmailEl, "");
      setText(errPasswordEl, "");
      setText(statusEl, "");

      const email = (emailEl?.value || "").trim();
      const password = (passwordEl?.value || "").trim();

      let hasError = false;
      if (!email) {
        setText(errEmailEl, "E-mailadres is verplicht.", "error");
        hasError = true;
      }
      if (!password) {
        setText(errPasswordEl, "Wachtwoord is verplicht.", "error");
        hasError = true;
      }
      if (hasError) return;

      setText(statusEl, "Bezig met inloggen...", "info");

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data || data.ok === false) {
          const msg =
            (data && (data.error || data.message)) ||
            (res.status === 401
              ? "E-mailadres of wachtwoord onjuist."
              : `Inloggen mislukt (status ${res.status}).`);
          setText(statusEl, msg, "error");
          return;
        }

        // Verwachte structuur: { ok: true, token, role, companyId }
        const token = data.token;
        const role = data.role || "";
        const companyId = data.companyId || null;

        if (!token) {
          setText(
            statusEl,
            "Inloggen lijkt gelukt, maar er is geen token ontvangen.",
            "error"
          );
          return;
        }

        // JWT opslaan in localStorage voor dashboard/admin
        localStorage.setItem("token", token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role);
        if (companyId) {
          localStorage.setItem("companyId", companyId);
        } else {
          localStorage.removeItem("companyId");
        }

        setText(statusEl, "Inloggen geslaagd, even geduld...", "success");

        // Bepalen of het een admin is
        const lowerEmail = email.toLowerCase();
        const isAdmin =
          role === "admin" ||
          lowerEmail === "admin@irisje.nl" ||
          lowerEmail === "info@irisje.nl";

        setTimeout(() => {
          window.location.href = isAdmin ? "admin.html" : "dashboard.html";
        }, 600);
      } catch (err) {
        console.error("Login error:", err);
        setText(
          statusEl,
          "Er is een fout opgetreden bij het inloggen. Probeer het later opnieuw.",
          "error"
        );
      }
    });
  });
})();
