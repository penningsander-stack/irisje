// frontend/js/request.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");

  if (!form) {
    console.error("❌ Formulier met id='requestForm' niet gevonden.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value?.trim();
    const email = document.getElementById("email")?.value?.trim();
    const message = document.getElementById("message")?.value?.trim();
    const companyId = form.dataset.companyId;

    if (!name || !email || !message) {
      alert("❌ Vul alle velden in voordat je de aanvraag verzendt.");
      return;
    }

    const data = { name, email, message, companyId };

    try {
      const response = await fetch("https://irisje-backend.onrender.com/api/publicRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Serverfout: ${response.status}`);
      }

      const result = await response.json();

      if (result && result.success) {
        alert("✅ Aanvraag succesvol verzonden!");
        form.reset();
      } else {
        alert("❌ Er ging iets mis bij het verzenden. Probeer het later opnieuw.");
      }
    } catch (err) {
      console.error("❌ Fout bij verzenden:", err);
      alert("❌ Er ging iets mis bij het verzenden. Controleer je internetverbinding en probeer het opnieuw.");
    }
  });
});
