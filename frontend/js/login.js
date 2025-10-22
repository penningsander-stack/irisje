// frontend/js/login.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ login.js geladen");

  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");
  const btn = document.getElementById("loginBtn");

  if (!form) {
    console.error("❌ Formulier met id='loginForm' niet gevonden");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Bezig...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("🔹 Inlogpoging:", email);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("🔹 Response:", data);

      if (data.ok) {
        window.location.href = "dashboard.html";
      } else {
        message.textContent = data.error || "Onjuiste inloggegevens.";
        message.style.display = "block";
      }
    } catch (err) {
      console.error("❌ Fout bij inloggen:", err);
      message.textContent = "Server niet bereikbaar.";
      message.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Inloggen";
    }
  });
});
