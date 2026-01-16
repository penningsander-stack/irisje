// frontend/js/request.js
// Verstuurt aanvraag → POST /api/requests

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("requestForm");
  if (!form) {
    console.error("❌ requestForm niet gevonden");
    return;
  }

  const errorBox = document.getElementById("requestError");
  const submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (errorBox) errorBox.textContent = "";
    if (submitBtn) submitBtn.disabled = true;

    // 🔴 VELDEN – exact zoals in jouw HTML
    const name = form.querySelector("input[name='name']")?.value.trim();
    const email = form.querySelector("input[name='email']")?.value.trim();
    const city = form.querySelector("input[name='city']")?.value.trim();
    const sector = form.querySelector("select[name='sector']")?.value.trim();
    const specialty = form.querySelector("select[name='specialty']")?.value.trim();
    const description = form.querySelector("textarea[name='message']")?.value.trim();

    // === VALIDATIE ===
    if (!name || !email || !city || !sector || !description) {
      const msg = "Vul alle verplichte velden in.";
      if (errorBox) errorBox.textContent = msg;
      else alert(msg);

      if (submitBtn) submitBtn.disabled = false;
      return;
    }

    // === PAYLOAD ===
    const payload = {
      name,
      email,
      city,                 // ✅ plaats
      sector,               // ✅ categorie
      specialty: specialty || null, // ✅ specialisme
      description           // ✅ backend-verplicht
    };

    console.log("📤 REQUEST PAYLOAD", payload);

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
        console.error("❌ STATUS:", res.status);
        throw new Error(res.status);
      }

      const data = await res.json();

      if (!data.requestId) {
        throw new Error("requestId ontbreekt");
      }

      console.log("✅ REQUEST AANGEMAAKT:", data.requestId);

      window.location.href = `/results.html?requestId=${data.requestId}`;

    } catch (err) {
      console.error("❌ AANVRAAG FOUT:", err);

      const msg = "Aanvraag mislukt. Probeer het opnieuw.";
      if (errorBox) errorBox.textContent = msg;
      else alert(msg);

      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
