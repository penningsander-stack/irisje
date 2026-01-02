// frontend/js/select-companies.js
// v20260102-step14d-optionA-FINAL
// Correct afgestemd op select-companies.html

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initSelectCompanies);

async function initSelectCompanies() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const statusBox = document.getElementById("statusBox");
  const container = document.getElementById("companiesContainer");

  if (!statusBox || !container) {
    console.error("❌ Vereiste HTML-elementen ontbreken");
    return;
  }

  statusBox.textContent = "";
  container.innerHTML = "";

  if (!requestId) {
    statusBox.textContent = "Aanvraag-ID ontbreekt.";
    return;
  }

  try {
    // 1. Haal publieke aanvraag op
    const reqRes = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const reqData = await reqRes.json();

    if (!reqRes.ok || !reqData.ok || !reqData.request) {
      throw new Error("Aanvraag niet gevonden");
    }

    const { category, specialty } = reqData.request;

    if (!category) {
      statusBox.textContent = "Categorie ontbreekt in aanvraag.";
      return;
    }

    // 2. Zoek bedrijven (zonder city/postcode)
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

    if (!Array.isArray(compData.results) || compData.results.length === 0) {
      statusBox.textContent = "Geen bedrijven gevonden voor deze aanvraag.";
      return;
    }

    renderCompanies(compData.results);

  } catch (err) {
    console.error("❌ Select-companies fout:", err);
    statusBox.textContent = "Fout bij laden van bedrijven.";
  }
}

function renderCompanies(companies) {
  const container = document.getElementById("companiesContainer");
  if (!container) return;

  companies.forEach(company => {
    const card = document.createElement("div");
    card.className =
      "border rounded-lg p-4 flex items-center justify-between bg-white shadow-sm";

    card.innerHTML = `
      <label class="flex items-center gap-3 cursor-pointer w-full">
        <input
          type="checkbox"
          name="company"
          value="${company._id}"
          class="w-5 h-5 accent-indigo-600"
        >
        <div>
          <div class="font-semibold text-gray-900">${company.name}</div>
          <div class="text-sm text-gray-500">${company.city || ""}</div>
        </div>
      </label>
    `;

    container.appendChild(card);
  });
}
