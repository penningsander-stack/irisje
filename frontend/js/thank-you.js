// frontend/js/thank-you.js
// A16.6 – frontend-only bevestiging + opschonen + fallback

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("sentCompaniesBox");
  const list = document.getElementById("sentCompaniesList");

  if (!box || !list) return;

  let companies = null;

  try {
    const raw = sessionStorage.getItem("selectedCompaniesSummary");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        companies = parsed;
      }
    }
  } catch (err) {
    console.warn("Kon selectedCompaniesSummary niet lezen:", err);
  }

  // -------------------------
  // Fallback: geen bedrijven
  // -------------------------
  if (!companies) {
    // Bewust geen foutmelding, maar duidelijke uitleg
    box.style.display = "block";
    list.innerHTML = "";

    const li = document.createElement("li");
    li.textContent =
      "De geselecteerde bedrijven zijn niet meer beschikbaar. " +
      "Bedrijven nemen contact met je op als je aanvraag is ontvangen.";
    list.appendChild(li);

    // Opschonen (ook in fallback)
    cleanupStorage();
    return;
  }

  // -------------------------
  // Normale weergave
  // -------------------------
  list.innerHTML = "";

  companies.forEach((company) => {
    if (!company || !company.name) return;

    const li = document.createElement("li");
    li.textContent = company.city
      ? `${company.name} (${company.city})`
      : company.name;

    list.appendChild(li);
  });

  box.style.display = "block";

  // -------------------------
  // Opschonen na tonen
  // -------------------------
  cleanupStorage();

  function cleanupStorage() {
    try {
      sessionStorage.removeItem("selectedCompaniesSummary");
      sessionStorage.removeItem("selectedCompanyIds");
      sessionStorage.removeItem("requestId");
      sessionStorage.removeItem("requestSent");
    } catch (e) {
      console.warn("Opschonen sessionStorage mislukt:", e);
    }
  }
});
