// frontend/js/select-companies.js
// v20260102-step14d
// Selectiepagina bedrijven – matching op category + specialty (GEEN locatie)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initSelectCompanies);

async function initSelectCompanies() {
  const params = new URLSearchParams(window.location.search);

  const category = params.get("category") || "";
  const specialty = params.get("specialty") || "";

  const errorEl = document.getElementById("selectError");
  const listEl = document.getElementById("companyList");

  errorEl.textContent = "";
  listEl.innerHTML = "";

  // ✅ ENIGE vereiste: category
  if (!category) {
    errorEl.textContent = "Categorie ontbreekt.";
    return;
  }

  try {
    const query = new URLSearchParams();
    query.set("category", category);
    if (specialty) query.set("specialty", specialty);

    const res = await fetch(`${API_BASE}/companies/search?${query.toString()}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Zoeken mislukt");
    }

    if (!data.items || data.items.length === 0) {
      errorEl.textContent = "Geen bedrijven gevonden voor deze aanvraag.";
      return;
    }

    renderCompanies(data.items);
  } catch (err) {
    console.error("❌ Fout bij laden bedrijven:", err);
    errorEl.textContent = "Fout bij laden van bedrijven.";
  }
}

function renderCompanies(companies) {
  const listEl = document.getElementById("companyList");

  companies.forEach(company => {
    const card = document.createElement("div");
    card.className = "company-card";

    card.innerHTML = `
      <label class="company-select">
        <input type="checkbox" name="company" value="${company._id}">
        <div class="company-info">
          <strong>${company.name}</strong><br>
          <span>${company.city || ""}</span>
        </div>
      </label>
    `;

    listEl.appendChild(card);
  });
}
