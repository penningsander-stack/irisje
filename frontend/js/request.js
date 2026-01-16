// frontend/js/request.js
// Stap 1: aanvraag indienen → POST /api/requests

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) {
    console.warn("requestForm niet gevonden");
    return;
  }

  const submitBtn = form.querySelector("button[type='submit']");
  const errorBox = document.getElementById("requestError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.textContent = "";
    if (submitBtn) submitBtn.disabled = true;

    // === FORM VELDEN ===
    const name = form.querySelector("[name='name']")?.value.trim();
    const email = form.querySelector("[name='email']")?.value.trim();
    const city = form.querySelector("[name='city']")?.value.trim();
    const sector = form.querySelector("[name='sector']")?.value.trim();
    const specialty = form.querySelector("[name='specialty']")?.value.trim();
    const message = form.querySelector("[name='message']")?.value.trim();

    // === VALIDATIE ===
    if (!name || !email || !city || !sector || !message) {
      if (errorBox) {
        errorBox.textContent = "Vul alle verplichte velden in.";
      } else {
        alert("Vul alle verplichte velden in.");
      }
      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // === PAYLOAD ===
    // 🔴 BELANGRIJK: backend verwacht `description`
    const payload = {
      name,
      email,
      city,
      sector,
      specialty: specialty || null,
      description: message // ✅ FIX
    };

    console.log("REQUEST PAYLOAD:", payload);

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
        console.error("REQUEST STATUS:", res.status);
        throw new Error(res.status);
      }

      const data = await res.json();

      console.log("REQUEST RESPONSE:", data);

      if (!data.requestId) {
        throw new Error("requestId ontbreekt in response");
      }

      // === DOOR NAAR RESULTATEN ===
      window.location.href = `/results.html?requestId=${data.requestId}`;

    } catch (err) {
      console.error("Aanvraag mislukt:", err);

      if (errorBox) {
        errorBox.textContent =
          "Aanvraag mislukt. Controleer je invoer en probeer het opnieuw.";
      } else {
        alert("Aanvraag mislukt. Probeer het opnieuw.");
      }

      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
