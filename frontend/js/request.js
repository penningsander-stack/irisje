// frontend/js/request.js
// v2026-01-13 — sector-afleiding definitief gefixt

(() => {
  const API_REQUESTS = "https://irisje-backend.onrender.com/api/publicRequests";
  const API_COMPANY_BY_SLUG = "https://irisje-backend.onrender.com/api/companies/slug";

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  const form = document.getElementById("step1Form");
  const err = document.getElementById("formError");
  const submitBtn = document.getElementById("submitBtn");

  const companyBlock = document.getElementById("companyBlock");
  const companyNameEl = document.getElementById("companyName");
  const companyHint = document.getElementById("companyHint");
  const genericTitle = document.getElementById("genericTitle");

  const sectorBlock = document.getElementById("sectorBlock");
  const categorySelect = document.getElementById("categorySelect");

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const cityInput = document.getElementById("cityInput");
  const messageInput = document.getElementById("messageInput");

  let fixedSector = null;

  const disableSubmit = (text) => {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60");
    submitBtn.textContent = text;
  };

  const enableSubmit = () => {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-60");
    submitBtn.textContent = "Volgende stap";
  };

  // sector altijd verborgen bij companySlug
  if (companySlug && sectorBlock) {
    sectorBlock.classList.add("hidden");
    categorySelect.required = false;
    categorySelect.disabled = true;
    disableSubmit("Bedrijf laden…");
  }

  // helper: sector afleiden uit backend-company
  const resolveSector = (company) => {
    if (!company) return null;

    // meest gebruikte varianten binnen Irisje
    if (company.sector) return company.sector;
    if (company.category) return company.category;
    if (company.mainCategory) return company.mainCategory;

    if (Array.isArray(company.categories) && company.categories.length > 0) {
      return company.categories[0];
    }

    return null;
  };

  // bedrijf ophalen
  if (companySlug) {
    fetch(`${API_COMPANY_BY_SLUG}/${encodeURIComponent(companySlug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const company = data?.company || data;

        if (!company || !company.name) {
          err.textContent = "Bedrijf niet gevonden.";
          err.classList.remove("hidden");
          return;
        }

        companyNameEl.textContent = company.name;
        companyBlock.classList.remove("hidden");
        genericTitle?.classList.add("hidden");

        fixedSector = resolveSector(company);

        if (!fixedSector) {
          err.textContent =
            "Kon de sector van dit bedrijf niet bepalen. Neem contact op met support.";
          err.classList.remove("hidden");
          return;
        }

        enableSubmit();
      })
      .catch(() => {
        err.textContent = "Kon bedrijfsgegevens niet laden.";
        err.classList.remove("hidden");
      });
  }

  // submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const city = cityInput.value.trim();
    const message = messageInput.value.trim();

    const sector = companySlug ? fixedSector : categorySelect.value;

    if (!name || !email || !city) {
      err.textContent = "Vul je naam, e-mail en plaats/postcode in.";
      err.classList.remove("hidden");
      return;
    }

    if (!sector) {
      err.textContent = "Sector ontbreekt. Probeer opnieuw.";
      err.classList.remove("hidden");
      return;
    }

    disableSubmit("Even bezig…");

    try {
      const res = await fetch(API_REQUESTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          city,
          name,
          email,
          message,
          companySlug
        })
      });

      const data = await res.json();

      if (!res.ok || !data.requestId) throw new Error();

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
      enableSubmit();
    }
  });
})();
