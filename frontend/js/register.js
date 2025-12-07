// frontend/js/register.js
// v20251206-PREMIUM-STABLE

document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://irisje-backend.onrender.com/api";
  const ENDPOINT = API_BASE + "/auth/register";

  const form = document.getElementById("registerForm");
  const msgBox = document.getElementById("registerMessage");

  const companyName = document.getElementById("companyName");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const terms = document.getElementById("terms");

  function show(msg, error = false) {
    msgBox.textContent = msg;
    msgBox.className = "rq-status " + (error ? "text-red-600" : "text-green-600");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    show("");

    if (!companyName.value.trim()) return show("Vul een bedrijfsnaam in.", true);
    if (!email.value.trim()) return show("Vul een e-mailadres in.", true);
    if (password.value.length < 8) return show("Wachtwoord moet minimaal 8 tekens bevatten.", true);
    if (password.value !== confirmPassword.value) return show("Wachtwoorden komen niet overeen.", true);
    if (!terms.checked) return show("Je moet akkoord gaan met de voorwaarden.", true);

    show("⏳ Account wordt aangemaakt...");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName.value.trim(),
          email: email.value.trim(),
          password: password.value.trim()
        })
      });

      const json = await res.json();

      if (!res.ok) {
        const m = json.error || json.message || "Registratie mislukt.";
        return show(m, true);
      }

      show("✅ Account succesvol aangemaakt! Je wordt doorgestuurd...");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

    } catch (err) {
      console.error(err);
      show("❌ Serverfout. Probeer het later opnieuw.", true);
    }

  });

});
