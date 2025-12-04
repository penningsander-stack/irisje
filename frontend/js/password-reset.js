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

    const token = getToken();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    // 🔸 Basisvalidatie
    if (!token) {
      msg.textContent = "❌ Ongeldige of ontbrekende link.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    if (!password || !confirm) {
      msg.textContent = "❌ Vul beide wachtwoordvelden in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    if (password.length < 8) {
      msg.textContent = "❌ Wachtwoord moet minimaal 8 tekens lang zijn.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    if (password !== confirm) {
      msg.textContent = "❌ Wachtwoorden komen niet overeen.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    msg.textContent = "⏳ Bezig met bijwerken...";
    msg.className = "text-gray-500 text-center text-sm";

    try {
      // 🔹 Nieuwe wachtwoord doorgeven aan backend
      const res = await fetch(`${API_BASE}/auth/reset-password/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Fout bij wijzigen wachtwoord.");

      // ✅ Succes
      msg.textContent = "✅ Wachtwoord succesvol gewijzigd! Je kunt nu inloggen.";
      msg.className = "text-green-600 text-center text-sm";

      setTimeout(() => (window.location.href = "login.html"), 1500);
    } catch (err) {
      console.error("❌ Resetfout:", err);
      msg.textContent = "❌ De link is ongeldig of verlopen. Vraag opnieuw een herstel-link aan.";
      msg.className = "text-red-600 text-center text-sm";
    }
  });
});
