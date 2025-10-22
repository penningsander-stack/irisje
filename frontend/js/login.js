// frontend/js/login.js
// ==========================================
// Irisje.nl - Login (stabiele, robuuste versie)
// ==========================================

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const btn = document.getElementById("loginBtn");

  // Zorg dat het message-element bestaat (maak aan indien nodig)
  let message = document.getElementById("loginMessage");
  if (!message) {
    message = document.createElement("p");
    message.id = "loginMessage";
    message.className = "error-message";
    message.style.display = "none";
    form.appendChild(message);
  }

  const showMessage = (text) => {
    message.textContent = text || "";
    message.style.display = text ? "block" : "none";
  };

  const setBusy = (busy) => {
    if (!btn) return;
    btn.disabled = !!busy;
    btn.textContent = busy ? "Inloggen…" : "Inloggen";
  };

  if (!form) {
    console.error("Loginform niet gevonden (#loginForm).");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("");
    setBusy(true);

    // Lees waarden veilig uit het formulier
    const email = (form.email?.value || "").trim();
    const password = form.password?.value || "";

    if (!email || !password) {
      showMessage("Vul e-mail en wachtwoord in.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include", // belangrijk voor sessie-cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      // Probeer JSON te lezen, ook bij foutstatus
      let data = null;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok || !data || !data.ok) {
        // Toon backend-fout of generieke melding
        const errText =
          data?.error ||
          (res.status === 401
            ? "Onjuiste inloggegevens"
            : "Serverfout bij inloggen");
        showMessage(errText);
        setBusy(false);
        return;
      }

      // Succes → naar dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login request error:", err);
      showMessage("Kon geen verbinding maken met de server.");
      setBusy(false);
    }
  });
});
