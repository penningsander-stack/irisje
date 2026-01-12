// frontend/js/request.js
// Definitieve fix: city verplicht meesturen bij aanmaken aanvraag

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
    const category = document.getElementById("categorySelect").value;

    if (!name || !email || !city || !category) {
      err.textContent = "Niet alle verplichte velden zijn ingevuld.";
      err.classList.remove("hidden");
      return;
    }

    const payload = {
      name,
      email,
      city,
      message,
      category,
      categories: [category],
      specialty: "",
      specialties: [],
      companySlug: null
    };

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data?.requestId) throw new Error();
      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    }
  });
})();
