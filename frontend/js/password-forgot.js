// frontend/js/password-forgot.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotForm");
  const msg = document.getElementById("forgotMessage");

  if (!form) return console.error("⚠️ Formulier niet gevonden (id='forgotForm')");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Bezig met verzenden...";
    msg.className = "text-gray-500 text-center text-sm";

    const email = document.getElementById("email").value.trim();
    if (!email) {
      msg.textContent = "❌ Vul een e-mailadres in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Verzenden mislukt.");

      msg.textContent = "✅ E-mail met herstelinstructies verzonden (controleer ook je spammap).";
      msg.className = "text-green-600 text-center text-sm";
      form.reset();
    } catch (err) {
      console.error("Fout bij wachtwoordherstel:", err);
      msg.textContent = "❌ " + err.message;
      msg.className = "text-red-600 text-center text-sm";
    }
  });
});
