// frontend/js/request.js
// Definitieve, robuuste aanvraaglogica (plaats + specialisme gefixt)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) return;

  function getValue(selectors) {
    for (const sel of selectors) {
      const el = form.querySelector(sel);
      if (el && el.value && el.value.trim()) {
        return el.value.trim();
      }
    }
    return "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // --- VELDEN (ROBUUST) ---
    const name = getValue([
      '[name="name"]',
      '#name'
    ]);

    const email = getValue([
      '[name="email"]',
      '#email'
    ]);

    const city = getValue([
      '[name="city"]',
      '[name="place"]',
      '[name="plaats"]',
      '#city',
      '#place',
      '#plaats'
    ]);

    const category = getValue([
      '[name="category"]',
      '#category'
    ]);

    const specialty = getValue([
      '[name="specialty"]',
      '[name="specialism"]',
      '[name="specialisme"]',
      '#specialty',
      '#specialism',
      '#specialisme'
    ]);

    const message = getValue([
      '[name="message"]',
      '[name="description"]',
      '#message',
      '#description'
    ]);

    const selectedCompanies = JSON.parse(
      localStorage.getItem("selectedCompanyIds") || "[]"
    );

    // --- HARD VALIDATIE ---
    if (!name || !email || !message) {
      alert("Naam, e-mailadres en omschrijving zijn verplicht.");
      return;
    }

    if (!category || !city) {
      alert("Categorie en plaats zijn verplicht.");
      return;
    }

    // --- PAYLOAD (EXACT BACKEND-COMPATIBEL) ---
    const payload = {
      name,
      email,
      city,
      category,
      specialty,
      message,
      companyIds: selectedCompanies
    };

    console.log("➡️ AANVRAAG PAYLOAD:", payload);

    try {
      const res = await fetch(
        "https://irisje-backend.onrender.com/api/requests",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ AANVRAAG OK:", data);

      localStorage.removeItem("selectedCompanyIds");
      window.location.href = "/request-success.html";

    } catch (err) {
      console.error("❌ AANVRAAG FOUT:", err);
      alert("Aanvraag kon niet worden verstuurd.");
    }
  });
});
