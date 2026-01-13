// frontend/js/request.js
// v2026-01-13 — companySlug + sector verbergen (HTML-first) + bedrijfsnaam tonen

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

  // Sector is HTML-first hidden. Alleen tonen bij algemene aanvraag.
  const setSectorVisible = (visible) => {
    if (!sectorBlock || !categorySelect) return;
    if (visible) {
      sectorBlock.classList.remove("hidden");
      categorySelect.required = true;
      categorySelect.disabled = false;
    } else {
      sectorBlock.classList.add("hidden");
      categorySelect.required = false; // belangrijk: anders blokkeert HTML5 validation alsnog
      categorySelect.disabled = true;
    }
  };

  // State
  let fixedSector = null;

  // 1) Page mode
  if (!companySlug) {
    // Algemene aanvraag: sector tonen
    setSectorVisible(true);
  } else {
    // Gerichte aanvraag: sector nooit tonen
    setSectorVisible(false);

    // Bedrijf ophalen voor naam + sector vastzetten
    fetch(`${API_COMPANY_BY_SLUG}/${encodeURIComponent(companySlug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // ondersteuning voor beide mogelijke shapes: {company:{...}} of direct company object
        const company = data?.company || data;

        if (!company || !company.name) {
          // slug ongeldig: terug naar algemene aanvraag-UX (maar laat user verder gaan)
          companyHint.textContent = "Bedrijf niet gevonden. Je kunt wel een algemene aanvraag doen.";
          companyHint.classList.remove("hidden");
          companyBlock.classList.remove("hidden");
          return;
        }

        companyNameEl.textContent = company.name;
        companyBlock.classList.remove("hidden");
        if (genericTitle) genericTitle.classList.add("hidden");

        // sector van bedrijf vastzetten voor de request
        fixedSector = company.category || company.sector || null;
      })
      .catch(() => {
        // network error: laat user alsnog doorgaan (zonder naam)
        companyHint.textContent = "Kon bedrijfsgegevens niet laden. Je kunt wel doorgaan met je aanvraag.";
        companyHint.classList.remove("hidden");
        companyBlock.classList.remove("hidden");
      });
  }

  // 2) Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.classList.add("hidden");

    // Basis validatie (simpel en duidelijk)
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
      err.textContent = "Kies een sector.";
      err.classList.remove("hidden");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60");
    submitBtn.textContent = "Even bezig…";

    try {
      const res = await fetch(API_REQUESTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          city,
          // deze velden slaan we nog niet op (optioneel later), maar sturen alvast mee
          name,
          email,
          message,
          companySlug: companySlug || null
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.requestId) {
        throw new Error(data?.error || "Request failed");
      }

      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch {
      err.textContent = "Aanvraag mislukt. Probeer het opnieuw.";
      err.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60");
      submitBtn.textContent = "Volgende stap";
    }
  });
})();
