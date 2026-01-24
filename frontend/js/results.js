// frontend/js/results.js
// A2 – resultaten ophalen o.b.v. requestId (plaats + categorie + specialisme)

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const titleEl = document.getElementById("resultsTitle");
  const infoEl = document.getElementById("resultsInfo");
  const gridEl = document.getElementById("companiesGrid");
  const errorEl = document.getElementById("resultsError");

  if (!requestId) {
    errorEl.textContent = "Geen aanvraag gevonden.";
    errorEl.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`
    );

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.message || "Resultaten konden niet worden geladen");
    }

    const { request, companies } = data;

    titleEl.textContent = "Geschikte bedrijven voor jouw aanvraag";
    infoEl.textContent = `${request.sector} • ${request.specialty} • ${request.city}`;

    if (!Array.isArray(companies) || companies.length === 0) {
      infoEl.textContent += " — Geen bedrijven gevonden.";
      return;
    }

    gridEl.innerHTML = "";

    companies.forEach((c) => {
      const card = document.createElement("div");
      card.className =
        "bg-white rounded-lg shadow p-5 border border-gray-200";

      card.innerHTML = `
        <h3 class="text-lg font-semibold mb-1">${c.name}</h3>
        <p class="text-sm text-gray-600 mb-2">${c.city}</p>
        <a href="/company.html?slug=${c.slug}"
           class="inline-block mt-2 text-indigo-600 font-medium">
          Bekijk profiel →
        </a>
      `;

      gridEl.appendChild(card);
    });
  } catch (err) {
    console.error("results.js error:", err);
    errorEl.textContent =
      "Resultaten konden niet worden geladen.";
    errorEl.classList.remove("hidden");
  }
});
