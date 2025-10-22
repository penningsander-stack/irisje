// frontend/js/login.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btn = document.getElementById("loginBtn");
  const message = document.getElementById("loginMessage");

  if (!form) {
    console.error("❌ Formulier met id='loginForm' niet gevonden");
    return;
  }

  const showMessage = (text) => {
    message.textContent = text || "";
    message.style.display = text ? "block" : "none";
  };

  const setBusy = (busy) => {
    btn.disabled = !!busy;
    btn.textContent = busy ? "Inloggen…" : "Inloggen";
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");
    setBusy(true);

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showMessage("Vul e-mail en wachtwoord in.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      let data = null;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok || !data || !data.ok) {
        const errText = data?.error || (res.status === 401 ? "Onjuiste inloggegevens" : "Serverfout bij inloggen");
        showMessage(errText);
        setBusy(false);
        return;
      }

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login request error:", err);
      showMessage("Kon geen verbinding maken met de server.");
      setBusy(false);
    }
  });
});
