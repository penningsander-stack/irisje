// frontend/js/request.js
// Definitieve fix: backend verwacht 'sector' (niet 'category')

(() => {
  const API = "https://irisje-backend.onrender.com/api/publicRequests";

  const form = document.getElementById("step1Form");
  const err = document.getElementById("formError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const city = document.getElementById("cityInput").value.trim();
    const message =
      document.getElementById("messageInput").value.trim() ||
      "Geen aanvullende toelichting opgegeven.";
    const sector = document.getElementById("categorySelect").value;

    if (!name || !email || !sector) {
      err.textContent = "Niet alle verplichte velden zijn ingevuld.";
      err.classList.remove("hidden");
      return;
    }

    const payload = {
      sector,          // ⬅️ DIT WAS HET PROBLEEM
      city,
      name,            // mag mee, wordt genegeerd door model
      email,           // idem
      message          // idem
    };

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?._id) throw new Error();
      window.location.href = `/results.html?requestId=${data._id}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    }
  });
})();
