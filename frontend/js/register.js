// frontend/js/register.js

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const messageEl = document.getElementById("registerMessage");

  // 🔹 Als gebruiker al is ingelogd → direct doorsturen
  if (localStorage.getItem("userEmail")) {
    window.location.href = "dashboard.html";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.textContent = "Bezig met registreren...";
    messageEl.className = "text-gray-500 text-sm text-center";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
      messageEl.textContent = "❌ Vul alle velden in.";
      messageEl.className = "text-red-600 text-sm text-center";
      return;
    }

    if (password.length < 8) {
      messageEl.textContent = "❌ Het wachtwoord moet minimaal 8 tekens bevatten.";
      messageEl.className = "text-red-600 text-sm text-center";
      return;
    }

    try {
      // 🔹 Registratie bij backend
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registratie mislukt.");

      // ✅ Succes
      messageEl.textContent = "✅ Account aangemaakt! Je kunt nu inloggen.";
      messageEl.className = "text-green-600 text-sm text-center";

      // 🕒 Korte vertraging, dan naar login
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (err) {
      console.error("Fout bij registratie:", err);
      messageEl.textContent = "❌ " + err.message;
      messageEl.className = "text-red-600 text-sm text-center";
    }
  });

  // ✅ Fade-in animatie voor consistente UX
  const blocks = document.querySelectorAll("header, main section, footer");
  blocks.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => {
      el.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 150 * i);
  });
});
