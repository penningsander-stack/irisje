// frontend/js/request.js
// v2026-01-13 — race condition fixedSector FIX

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
  let companyLoaded = false;

  // helper
  const disableSubmit = (text) => {
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60");
    if (text) submitBtn.textContent = text;
  };

  const enableSubmit = (text = "Volgende stap") => {
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-60");
    submitBtn.textContent = text;
  };

  // Sector UI
  const setSectorVisible = (visible) => {
    if (!sectorBlock || !categorySelect) return;
    if (visible) {
      sectorBlock.classList.remove("hidden");
      categorySelect.required = true;
      categorySelect.disabled = false;
    } else {
      sectorBlock.classList.add("hidden");
      categorySelect.required = false;
      categorySelect.disabled = true;
    }
  };

  // MODE
  if (!companySlug) {
    // algemene aanvraag
    setSectorVisible(true);
  } else {
    // gerichte aanvraag
    setSectorVisible(false);
    disableSubmit("Bedrijf laden…");

    fetch(`${API_COMPANY_BY_SLUG}/${encodeURIComponent(companySlug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const company = data?.company || data;
        companyLoaded = true;

        if (!company || !company.name) {
          companyHint.textContent =
            "Bedrijf niet gevonden. Je kunt wel een algemene aanvraag doen.";
          companyHint.classList.remove("hidden");
          companyBlock.classList.remove("hidden");
          enableSubmit();
          return;
        }

        companyNameEl.textContent = company.name;
        companyBlock.classList.remove("hidden");
        genericTitle?.classList.add("hidden");

        fixedSector = company.category || company.sector || null;

        if (!fixedSector) {
          err.textContent =
            "Kon de sector van dit bedrijf niet bepalen. Probeer het later opnieuw.";
          err.classList.remove("hidden");
          return;
        }

        enableSubmit();
      })
      .catch(() => {
        companyLoaded = true;
        err.textContent =
          "Kon bedrijfsgegevens niet laden. Probeer het opnieuw.";
        err.classList.remove("hidden");
      });
  }

  // SUBMIT
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    if (companySlug && !companyLoaded) {
      return; // veiligheid
    }

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
      err.textContent = "Er is iets misgegaan met de sector. Probeer opnieuw.";
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
          companySlug: companySlug || null
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.requestId) {
        throw new Error();
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
      enableSubmit();
    }
  });
})();
