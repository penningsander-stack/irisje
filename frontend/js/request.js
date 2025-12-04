// frontend/js/request.js
// v20251118-CLEAN-ENHANCED

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) {
    console.error("❌ Formulier met id='requestForm' niet gevonden.");
    return;
  }

  const API_URL = "https://irisje-backend.onrender.com/api/publicRequests";

  /* ============================================================
     Helper: veilige POST
  ============================================================ */
  async function safePost(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error || data?.message || "Onbekende fout";
      throw new Error(msg);
    }
    return data;
  }

  /* ============================================================
     Helper: e-mail validatie
  ============================================================ */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ============================================================
     SUBMIT HANDLER
  ============================================================ */
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

    /* ============================================================
       Validatie
    ============================================================ */
    if (!name || !email || !message) {
      alert("❌ Vul ten minste naam, e-mail en bericht in.");
      return;
    }

    if (!isValidEmail(email)) {
      alert("❌ Voer een geldig e-mailadres in.");
      return;
    }

    if (!companyId) {
      alert("❌ Fout: geen bedrijf gekoppeld aan dit aanvraagformulier.");
      console.error("request.js → companyId ontbreekt");
      return;
    }

    const payload = {
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

    /* ============================================================
       Verzenden
    ============================================================ */
    form.querySelector("button[type='submit']").disabled = true;

    try {
      const result = await safePost(API_URL, payload);

      if (result?.success) {
        alert("✅ Aanvraag succesvol verzonden! Je ontvangt een bevestiging per e-mail.");
        form.reset();
      } else {
        alert("❌ Er ging iets mis bij het verzenden van de aanvraag.");
        console.warn("Backend response:", result);
      }
    } catch (err) {
      console.error("❌ Fout bij verzenden:", err);
      alert("❌ Er trad een fout op bij het verzenden. Probeer het opnieuw.");
    } finally {
      form.querySelector("button[type='submit']").disabled = false;
    }
  });
});
