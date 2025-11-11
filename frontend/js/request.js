// frontend/js/request.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) {
    console.error("❌ Formulier met id='requestForm' niet gevonden.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basisvelden
    const name = document.getElementById("name")?.value?.trim();
    const email = document.getElementById("email")?.value?.trim();
    const city = document.getElementById("city")?.value?.trim();
    const message = document.getElementById("message")?.value?.trim();
    const companyId = form.dataset.companyId || null;

    // Nieuwe aanvraagvelden
    const category = document.getElementById("category")?.value?.trim() || "";
    const specialty = document.getElementById("specialty")?.value?.trim() || "";
    const communication = document.querySelector("input[name='communication']:checked")?.value || "";
    const experience = document.querySelector("input[name='experience']:checked")?.value || "";
    const approach = document.querySelector("input[name='approach']:checked")?.value || "";
    const involvement = document.querySelector("input[name='involvement']:checked")?.value || "";

    // Validatie
    if (!name || !email || !message) {
      alert("❌ Vul ten minste naam, e-mail en bericht in voordat je de aanvraag verzendt.");
      return;
    }

    const data = {
      name,
      email,
      city,
      message,
      company: companyId,
      category,
      specialty,
      communication,
      experience,
      approach,
      involvement,
    };

    try {
      const response = await fetch("https://irisje-backend.onrender.com/api/publicRequests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert("✅ Aanvraag succesvol verzonden! Je ontvangt een bevestiging per e-mail.");
        form.reset();
      } else {
        console.error(result);
        alert("❌ Er ging iets mis bij het verzenden van de aanvraag.");
      }
    } catch (err) {
      console.error("❌ Fout bij verzenden:", err);
      alert("❌ Serverfout bij verzenden. Controleer je verbinding en probeer opnieuw.");
    }
  });
});
