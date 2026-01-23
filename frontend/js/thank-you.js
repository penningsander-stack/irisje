// frontend/js/thank-you.js
// Toon bedrijven waarnaar aanvraag is verstuurd (frontend-only, robuust)

document.addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("sentCompaniesBox");
  const list = document.getElementById("sentCompaniesList");

  if (!box || !list) return;

  const raw = sessionStorage.getItem("selectedCompaniesSummary");
  if (!raw) return;

  let companies;
  try {
    companies = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(companies) || companies.length === 0) return;

  list.innerHTML = "";

  companies.forEach(c => {
    const li = document.createElement("li");
    li.className = "selected-item";
    li.textContent = `${c.name}${c.city ? ` (${c.city})` : ""}`;
    list.appendChild(li);
  });

  box.style.display = "block";
});
