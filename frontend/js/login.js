// frontend/js/login.js
// v20251118-JWT-LOCALSTORAGE

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");

  // 🔄 Bij openen van de loginpagina alle client-side sessiegegevens opruimen
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("companyId");
    localStorage.removeItem("userEmail");
    sessionStorage.clear();
  } catch (e) {
    console.warn("Kon local/session storage niet legen:", e);
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      msg.textContent = "❌ Vul zowel e-mail als wachtwoord in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    msg.textContent = "⏳ Bezig met inloggen...";
    msg.className = "text-gray-500 text-center text-sm";

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials kunnen nu uit, we gebruiken geen cookies meer:
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.token) {
        throw new Error(data.error || "Ongeldige inloggegevens.");
      }

      const role = data.role || "company";
      const companyId = data.companyId || null;

      // 🧹 Eerst alles opruimen
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Kon storage niet wissen:", e);
      }

      // 🔑 JWT en rol opslaan
      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);
      if (companyId) {
        localStorage.setItem("companyId", companyId);
      }

      msg.textContent = "✅ Ingelogd! Even geduld...";
      msg.className = "text-green-600 text-center text-sm";

      // Admin → admin.html, rest → dashboard.html
      if (role === "admin" || email === "admin@irisje.nl") {
        return setTimeout(() => {
          window.location.href = "admin.html";
        }, 600);
      }

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error("❌ Login error:", err);
      msg.textContent = "❌ " + (err.message || "Er ging iets mis.");
      msg.className = "text-red-600 text-center text-sm";
    }
  });
});
