// frontend/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const errorEl = document.getElementById("error");

  loginBtn.addEventListener("click", async () => {
    errorEl.textContent = "";

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
      errorEl.textContent = "Vul alle velden in.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok) {
        errorEl.textContent = data.error || "Ongeldige inloggegevens.";
        return;
      }

      // ✅ Token opslaan
      localStorage.setItem("token", data.token);
      localStorage.setItem("company", JSON.stringify(data.company));

      // ✅ Doorsturen
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Inlogfout:", err);
      errorEl.textContent = "Serverfout of geen verbinding.";
    }
  });
});
