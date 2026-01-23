// frontend/js/thank-you.js
// Toon naar welke bedrijven de aanvraag is verzonden (frontend-only, veilig)

document.addEventListener("DOMContentLoaded", async () => {
  const box = document.getElementById("sentCompaniesBox");
  const list = document.getElementById("sentCompaniesList");

  if (!box || !list) return;

  const rawIds = sessionStorage.getItem("selectedCompanyIds");
  const requestId = sessionStorage.getItem("requestId");

  if (!rawIds || !requestId) return;

  let companyIds;
  try {
    companyIds = JSON.parse(rawIds);
  } catch {
    return;
  }

  if (!Array.isArray(companyIds) || companyIds.length === 0) return;

  try {
    // Haal bedrijven op via bestaande endpoint
    const res = await fetch(
      "https://irisje-backend.onrender.com/api/companies/byIds",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: companyIds })
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];

    if (!companies.length) return;

    list.innerHTML = "";

    companies.forEach((company) => {
      const li = document.createElement("li");
      li.className = "selected-item";
      li.textContent = `${company.name || "Onbekend bedrijf"}${
        company.city ? ` (${company.city})` : ""
      }`;
      list.appendChild(li);
    });

    box.style.display = "block";
  } catch (err) {
    console.error("thank-you companies error:", err);
  }
});
