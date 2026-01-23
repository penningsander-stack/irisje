// frontend/js/thank-you.js
// A16.7 – premium success weergave + veilige fallback

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

  // Fallback (bewust rustig, geen error state)
  if (!companies) {
    box.style.display = "block";
    list.innerHTML = "";

    const li = document.createElement("li");
    li.className = "text-gray-600";
    li.textContent =
      "De geselecteerde bedrijven zijn niet meer beschikbaar. " +
      "Bedrijven nemen contact met je op zodra je aanvraag is ontvangen.";
    list.appendChild(li);

    cleanupStorage();
    return;
  }

  // Normale weergave
  list.innerHTML = "";

  companies.forEach((company) => {
    if (!company || !company.name) return;

    const li = document.createElement("li");
    li.className = "flex items-center gap-2";

    const dot = document.createElement("span");
    dot.className = "inline-block w-2 h-2 rounded-full bg-indigo-500";

    const text = document.createElement("span");
    text.textContent = company.city
      ? `${company.name} (${company.city})`
      : company.name;

    li.appendChild(dot);
    li.appendChild(text);
    list.appendChild(li);
  });

  box.style.display = "block";

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
