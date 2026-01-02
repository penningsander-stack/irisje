// frontend/js/select-companies.js
// v20260102-step14d-optionA-fix
// Defensieve versie: crasht niet als HTML-element ontbreekt

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initSelectCompanies);

async function initSelectCompanies() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const errorEl = document.getElementById("selectError");
  const listEl = document.getElementById("companyList");

  if (errorEl) errorEl.textContent = "";
  if (listEl) listEl.innerHTML = "";

  if (!requestId) {
    if (errorEl) errorEl.textContent = "Aanvraag-ID ontbreekt.";
    return;
  }

  try {
    // 1. aanvraag ophalen
    const reqRes = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const reqData = await reqRes.json();

    if (!reqRes.ok || !reqData.ok || !reqData.request) {
      throw new Error("Aanvraag niet gevonden");
    }

    const { category, specialty } = reqData.request;

    if (!category) {
      if (errorEl) errorEl.textContent = "Categorie ontbreekt in aanvraag.";
      return;
    }

    // 2. bedrijven zoeken
    const query = new URLSearchParams();
    query.set("category", category);
    if (specialty) query.set("specialty", specialty);

    const compRes = await fetch(
      `${API_BASE}/companies/search?${query.toString()}`
    );
    const compData = await compRes.json();

    if (!compRes.ok || !compData.ok) {
      throw new Error("Zoeken naar bedrijven mislukt");
    }

    if (!compData.items || compData.items.length === 0) {
      if (errorEl) errorEl.textContent = "Geen bedrijven gevonden.";
      return;
    }

    renderCompanies(compData.items);
  } catch (err) {
    console.error("❌ Selectiepagina fout:", err);
    if (errorEl) errorEl.textContent = "Fout bij laden van bedrijven.";
  }
}

function renderCompanies(companies) {
  const listEl = document.getElementById("companyList");
  if (!listEl) return;

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
