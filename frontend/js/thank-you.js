// frontend/js/thank-you.js
// Route A – frontend-only bevestiging via sessionStorage

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

  if (!companies) {
    // Geen data → box verborgen laten (bewust, geen foutmelding)
    return;
  }

  // Lijst opbouwen
  list.innerHTML = "";

  companies.forEach((company) => {
    if (!company || !company.name) return;

    const li = document.createElement("li");
    li.textContent = company.city
      ? `${company.name} (${company.city})`
      : company.name;

    list.appendChild(li);
  });

  // Box tonen
  box.style.display = "block";
});
