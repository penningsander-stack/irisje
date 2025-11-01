// frontend/js/register.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("registerMessage");

  // 🔹 Als gebruiker al is ingelogd → direct doorsturen
  if (localStorage.getItem("userEmail")) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 🔸 Basisvalidatie
    if (!name || !email || !password) {
      msg.textContent = "❌ Vul alle velden in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = "❌ Vul een geldig e-mailadres in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    if (password.length < 8) {
      msg.textContent = "❌ Wachtwoord moet minimaal 8 tekens bevatten.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    msg.textContent = "⏳ Bezig met registreren...";
    msg.className = "text-gray-500 text-center text-sm";

    try {
      // 🔹 API-aanroep naar backend
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Registratie mislukt.");

      // ✅ Succesvol geregistreerd
      msg.textContent = "✅ Account aangemaakt! Bevestig je e-mailadres om verder te gaan.";
      msg.className = "text-green-600 text-center text-sm";

      // 🕒 Kort wachten, dan naar bevestigingspagina
      setTimeout(() => {
        window.location.href = "email-confirmation.html";
      }, 1500);
    } catch (err) {
      console.error("❌ Fout bij registratie:", err);
      msg.textContent = "❌ " + (err.message || "Er ging iets mis. Probeer het later opnieuw.");
      msg.className = "text-red-600 text-center text-sm";
    }
  });

  // ✅ Fade-in animatie
  const blocks = document.querySelectorAll("header, main section, footer");
  blocks.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.style.transition = "opacity .8s ease, transform .8s ease";
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 150 * i);
    });
  });
});
