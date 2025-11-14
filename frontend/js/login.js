const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("loginForm");
  const msg  = document.getElementById("loginMessage");

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
      // 🔹 Backend login
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ongeldige inloggegevens.");

      // 🎉 Login geslaagd → role + companyId komen direct uit backend
      const role = data.role || "company";
      const companyId = data.companyId || null;

      // 🗂️ Opslaan in localStorage
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);

      if (companyId) {
        localStorage.setItem("companyId", companyId);
      } else {
        localStorage.removeItem("companyId"); // belangrijk voor admin accounts
      }

      msg.textContent = "✅ Ingelogd! Even geduld...";
      msg.className = "text-green-600 text-center text-sm";

      // 🚀 Door naar dashboard
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 800);

    } catch (err) {
      console.error("❌ Login error:", err);
      msg.textContent = "❌ " + (err.message || "Er ging iets mis.");
      msg.className   = "text-red-600 text-center text-sm";
    }
  });
});
