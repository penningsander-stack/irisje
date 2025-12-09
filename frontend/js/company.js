// frontend/js/company.js
// v20251209-COMPANY-FIX-FINAL

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyDetail();
});

async function initCompanyDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  const container = document.getElementById("companyDetail");

  if (!slug) {
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Ongeldige pagina-URL (geen slug opgegeven).
        </div>`;
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/slug/${slug}`);
    if (!res.ok) throw new Error(`Backend gaf status: ${res.status}`);

    const data = await res.json();
    if (!data || data.ok === false) throw new Error("Bedrijf niet gevonden");

    renderCompany(data);
  } catch (err) {
    console.error("❌ company.js fout:", err);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8 text-slate-500">
          Bedrijf niet gevonden.
        </div>`;
    }
  }
}

function renderCompany(data) {
  const container = document.getElementById("companyDetail");
  if (!container) return;

  const name = data.name || "(Naam onbekend)";
  const city = data.city || "-";
  const categories = Array.isArray(data.categories)
    ? data.categories.join(", ")
    : "-";
  const description = data.description || "Geen beschrijving beschikbaar.";

  container.innerHTML = `
    <div class="surface-card p-6 rounded-2xl shadow-sm">
      <h1 class="text-xl font-semibold text-slate-900 mb-2">${name}</h1>
      <div class="text-sm text-slate-500 mb-1">${categories}</div>
      <div class="text-sm text-slate-500 mb-4">${city}</div>

      <div class="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
        ${description}
      </div>
    </div>
  `;
}
