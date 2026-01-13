// frontend/js/request.js
// v2026-01-13 — sector verbergen bij companySlug

(() => {
  const API_REQUESTS = "https://irisje-backend.onrender.com/api/publicRequests";
  const API_COMPANIES = "https://irisje-backend.onrender.com/api/companies/slug";

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  const companyBlock = document.getElementById("companyBlock");
  const companyNameEl = document.getElementById("companyName");
  const genericTitle = document.getElementById("genericTitle");

  const sectorBlock = document.getElementById("sectorBlock");
  const categorySelect = document.getElementById("categorySelect");

  const form = document.getElementById("step1Form");
  const err = document.getElementById("formError");

  let fixedSector = null;

  // 1️⃣ Bedrijf ophalen indien slug aanwezig
  if (companySlug) {
    fetch(`${API_COMPANIES}/${companySlug}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.company) return;

        const company = data.company;

        companyNameEl.textContent = company.name;
        companyBlock.classList.remove("hidden");
        genericTitle.classList.add("hidden");

        // sector vastzetten + verbergen
        fixedSector = company.category || null;
        sectorBlock.classList.add("hidden");
      })
      .catch(() => {});
  }

  // 2️⃣ Form submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    const city = document.getElementById("cityInput").value.trim();
    const sector = fixedSector || categorySelect.value;

    if (!sector) {
      err.textContent = "Kies een sector.";
      err.classList.remove("hidden");
      return;
    }

    try {
      const res = await fetch(API_REQUESTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          city: city || "",
          companySlug: companySlug || null
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.requestId) {
        throw new Error("Request failed");
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    }
  });
})();
