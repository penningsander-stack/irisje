// frontend/js/request.js
// v2026-01-12 — DEFINITIEVE FIX: city verplicht bij aanmaken

(() => {
  const API = "https://irisje-backend.onrender.com/api/publicRequests";

  const form = document.getElementById("step1Form");
  const err = document.getElementById("formError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    const payload = {
      name: document.getElementById("nameInput").value.trim(),
      email: document.getElementById("emailInput").value.trim(),
      city: document.getElementById("cityInput").value.trim(),
      message:
        document.getElementById("messageInput").value.trim() ||
        "Geen aanvullende toelichting opgegeven.",
      category: document.getElementById("categorySelect").value,
      categories: [document.getElementById("categorySelect").value],
      specialty: "",
      specialties: [],
      companySlug: null,
    };

    if (!payload.name || !payload.email || !payload.city || !payload.category) {
      err.textContent = "Niet alle verplichte velden zijn ingevuld.";
      err.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.requestId) {
        throw new Error("Backend fout");
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    }
  });
})();
