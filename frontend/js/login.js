// frontend/js/login.js
// Vaste backend-URL naar jouw Render backend (geen autodetect)
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#loginForm");
  const emailEl = document.querySelector("#email");
  const passEl = document.querySelector("#password");
  const errorEl = document.querySelector("#loginError");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include", // belangrijk voor cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailEl.value.trim(),
          password: passEl.value
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        errorEl.textContent = data?.error || "Serverfout bij inloggen";
        return;
      }
      window.location.href = "./dashboard.html";
    } catch (err) {
      errorEl.textContent = "Kon niet verbinden met de server.";
    }
  });
});
