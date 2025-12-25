// frontend/js/company.js
// v20251225-COMPANY-PROFILE-FIX-ITEM
//
// Fix: ondersteunt data.item (actuele backend),
//      data.company (oud),
//      of direct company-object.

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompanyDetail);

async function initCompanyDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const card = document.getElementById("companyCard");

  if (!id) {
    if (card) {
      card.innerHTML =
        '<div class="text-slate-500 text-center py-8">Ongeldige pagina-URL (geen bedrijf-ID).</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // 🔑 HIER ZAT DE FOUT — NU GEFIXT
    const company =
      data.item ||
      data.company ||
      data.data?.item ||
      data.data?.company ||
      data;

    if (!company || !company.name) {
      throw new Error("Bedrijfsgegevens ontbreken");
    }

    renderCompany(company);
  } catch (err) {
    console.error("❌ company.js:", err);
    if (card) {
      card.innerHTML =
        '<div class="text-slate-500 text-center py-8">Bedrijf niet gevonden.</div>';
    }
  }
}

function renderCompany(company) {
  const setText = (id, value, fallback = "") => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || fallback;
  };

  setText("companyName", company.name, "(Naam onbekend)");
  setText("companyTagline", company.tagline || company.description, "Geen beschrijving beschikbaar.");
  setText("companyCity", company.city, "");
  setText("companyCategories", (company.categories || []).join(", "), "");

  const verifiedEl = document.getElementById("verifiedBadge");
  if (verifiedEl) {
    verifiedEl.classList.toggle("hidden", !company.isVerified);
  }

  const metaEl = document.getElementById("companyMeta");
  if (metaEl) {
    metaEl.innerHTML = `
      ${company.city ? `<span>${company.city}</span>` : ""}
      ${company.categories?.length ? `<span>${company.categories[0]}</span>` : ""}
    `;
  }

  const ratingEl = document.getElementById("companyRating");
  if (ratingEl) {
    if (company.reviewCount > 0) {
      ratingEl.textContent = `${company.avgRating.toFixed(1)} (${company.reviewCount} reviews)`;
    } else {
      ratingEl.textContent = "Nog geen reviews";
    }
  }
}
