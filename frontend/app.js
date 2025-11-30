// frontend/app.js
const API = "https://irisje-backend.onrender.com";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  message.textContent = "Bezig met inloggen...";
  message.className = "text-gray-600";

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Ongeldige inloggegevens");
    }

    // Token opslaan
    localStorage.setItem("irisje_token", data.token);

    message.textContent = "✅ Inloggen gelukt! Doorsturen...";
    message.className = "text-green-600";

    // Wacht 1 seconde en ga naar dashboard
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  } catch (err) {
    message.textContent = "❌ " + err.message;
    message.className = "text-red-600";
  }
});
