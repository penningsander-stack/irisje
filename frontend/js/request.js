// frontend/js/request.js
// v2026-01-12 — EXACTE MATCH MET backend/routes/publicRequests.js

(() => {
  const API = "https://irisje-backend.onrender.com/api/publicRequests";

  const form = document.getElementById("step1Form");
  const err = document.getElementById("formError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    const sector = document.getElementById("categorySelect").value;
    const city = document.getElementById("cityInput").value.trim();

    if (!sector) {
      err.textContent = "Kies een sector.";
      err.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,        // ⬅️ exact wat backend verwacht
          city: city || ""
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.requestId) {
        throw new Error("Request failed");
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (e) {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    }
  });
})();
