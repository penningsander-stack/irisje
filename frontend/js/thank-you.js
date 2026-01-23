// frontend/js/thank-you.js
// A16.6 – frontend-only bevestiging + opschonen + fallback (gecontroleerd)

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("sentCompaniesBox");
  const list = document.getElementById("sentCompaniesList");

  if (!box || !list) return;

  let companies = [];

  try {
    const raw = sessionStorage.getItem("selectedCompaniesSummary");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        companies = parsed;
      }
    }
  } catch (err) {
    console.warn("Kon selectedCompaniesSummary niet lezen:", err);
  }

  list.innerHTML = "";

  // -------------------------
  // Geen (bruikbare) bedrijven
  // -------------------------
  const validCompanies = companies.filter(
    (c) => c && typeof c.name === "string" && c.name.trim() !== ""
  );

  if (validCompanies.length === 0) {
    box.style.display = "block";

    const li = document.createElement("li");
    li.textContent =
      "De geselecteerde bedrijven zijn niet meer beschikbaar. " +
      "Bedrijven nemen contact met je op zodra je aanvraag is ontvangen.";

    list.appendChild(li);
    cleanupStorage();
    return;
  }

  // -------------------------
  // Normale weergave
  // -------------------------
  validCompanies.forEach((company) => {
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
