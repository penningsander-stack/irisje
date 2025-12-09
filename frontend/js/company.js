// frontend/js/company.js
// v20251213-COMPANY-LOGO-FIX-FINAL

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
  const logo = data.logo || "";
  const hasLogo = logo && logo.trim() !== "";

  container.innerHTML = `
    <div class="surface-card rounded-2xl p-6 shadow-sm">

      <!-- LOGO -->
      <div class="w-full flex justify-center mb-4">
        ${
          hasLogo
            ? `<img src="${logo}" alt="${name}" class="w-32 h-32 object-contain rounded-xl shadow-sm bg-white" />`
            : `<div class="w-32 h-32 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 text-4xl shadow-inner">
                 🏢
               </div>`
        }
      </div>

      <!-- TITEL -->
      <h1 class="text-xl font-semibold text-slate-900 mb-1 text-center">${name}</h1>

      <!-- CATEGORIE + STAD -->
      <div class="text-center text-sm text-slate-600 mb-1">${categories}</div>
      <div class="text-center text-sm text-slate-500 mb-4">${city}</div>

      <!-- BESCHRIJVING -->
      <div class="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
        ${description}
      </div>

    </div>
  `;
}
