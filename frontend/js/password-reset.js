// frontend/js/password-reset.js

const API_BASE = "https://irisje-backend.onrender.com/api";

// 🔹 Token ophalen uit URL
function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetForm");
  const msg = document.getElementById("resetMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Bezig met bijwerken...";
    msg.className = "text-gray-500 text-center text-sm";

    const token = getToken();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (password !== confirm) {
      msg.textContent = "❌ Wachtwoorden komen niet overeen.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Fout bij wijzigen wachtwoord.");

      msg.textContent = "✅ Wachtwoord succesvol gewijzigd! Je kunt nu inloggen.";
      msg.className = "text-green-600 text-center text-sm";
      setTimeout(() => (window.location.href = "login.html"), 1800);
    } catch (err) {
      console.error("Resetfout:", err);
      msg.textContent = "❌ De link is ongeldig of verlopen.";
      msg.className = "text-red-600 text-center text-sm";
    }
  });
});
