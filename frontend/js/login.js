// frontend/js/login.js

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const messageEl = document.getElementById("loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.textContent = "Bezig met inloggen...";
    messageEl.className = "text-gray-500 text-sm";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ongeldige inloggegevens");

      // ✅ Login geslaagd — gegevens opslaan
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", data.role || "company");

      // 🔍 Ophalen van bedrijf-ID op basis van e-mailadres
      const companyRes = await fetch(`${API_BASE}/companies/byEmail/${encodeURIComponent(email)}`);
      const companyData = await companyRes.json();

      if (companyRes.ok && companyData && companyData._id) {
        localStorage.setItem("companyId", companyData._id);
      } else {
        console.warn("Geen bedrijf gevonden voor dit e-mailadres.");
      }

      messageEl.textContent = "✅ Ingelogd! Even geduld...";
      messageEl.className = "text-green-600 text-sm";

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (err) {
      console.error("Inlogfout:", err);
      messageEl.textContent = "❌ " + err.message;
      messageEl.className = "text-red-600 text-sm";
    }
  });
});
