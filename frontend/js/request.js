// frontend/js/request.js
// Definitieve aanvraag – stuurt exact wat backend verwacht

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // --- VELDEN UIT FORM ---
    const name = form.querySelector('[name="name"]')?.value.trim();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const city = form.querySelector('[name="city"]')?.value.trim();
    const category = form.querySelector('[name="category"]')?.value.trim();
    const specialty = form.querySelector('[name="specialty"]')?.value.trim();

    // ⬅️ DIT WAS HET GROTE PROBLEEM
    // Backend verwacht "message", geen "description"
    const message =
      form.querySelector('[name="description"]')?.value.trim() ||
      form.querySelector('[name="message"]')?.value.trim();

    // Geselecteerde bedrijven (uit results pagina)
    const selectedCompanies = JSON.parse(
      localStorage.getItem("selectedCompanyIds") || "[]"
    );

    // --- VALIDATIE (BACKEND COMPATIBEL) ---
    if (!name || !email || !message) {
      alert("Naam, e-mailadres en omschrijving zijn verplicht.");
      return;
    }

    if (!category || !city) {
      alert("Categorie en plaats zijn verplicht.");
      return;
    }

    // --- PAYLOAD EXACT ZOALS BACKEND VERWACHT ---
    const payload = {
      name,
      email,
      city,
      category,
      specialty,
      message,              // ⬅️ VERPLICHT
      companyIds: selectedCompanies
    };

    console.log("➡️ VERZEND REQUEST:", payload);

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      console.log("✅ AANVRAAG AANGEMAAKT:", data);

      // Opschonen
      localStorage.removeItem("selectedCompanyIds");

      // Door naar succespagina
      window.location.href = "/request-success.html";

    } catch (err) {
      console.error("❌ Aanvraag mislukt:", err);
      alert("Aanvraag kon niet worden verstuurd. Probeer het opnieuw.");
    }
  });
});
