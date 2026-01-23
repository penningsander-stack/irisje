// frontend/js/thank-you.js
// Toon naar welke bedrijven de aanvraag is verzonden
// + A14.3: sessionStorage netjes opruimen na render

document.addEventListener("DOMContentLoaded", () => {
  const boxEl = document.getElementById("sentCompaniesBox");
  const listEl = document.getElementById("sentCompaniesList");

  if (!boxEl || !listEl) return;

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
    console.error("Fout bij lezen selectedCompaniesSummary:", err);
  }

  if (!companies.length) {
    // Niets tonen → box verborgen houden
    boxEl.style.display = "none";
    return;
  }

  // Toon box
  boxEl.style.display = "block";
  listEl.innerHTML = "";

  companies.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = `${c.name}${c.city ? " – " + c.city : ""}`;
    listEl.appendChild(li);
  });

  // =========================
  // A14.3 – OPSCHONEN
  // =========================
  sessionStorage.removeItem("selectedCompaniesSummary");
  sessionStorage.removeItem("selectedCompanyIds");
  sessionStorage.removeItem("requestId");
  sessionStorage.removeItem("requestSent");
});
