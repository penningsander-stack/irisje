// frontend/js/company.js
// v20251225-COMPANY-PROFILE-PREMIUM-FALLBACK-SAFE
//
// Alleen UX-verbeteringen:
// - Professionele fallback-teksten
// - Geen lege secties meer
// - Geen wijzigingen aan routing, backend of data-structuur

const API_BASE = "https://irisje-backend.onrender.com/api";
const BACKEND_BASE = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyDetail();
});

async function initCompanyDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const card = document.getElementById("companyCard");

  if (!slug) {
    if (card) {
      card.innerHTML =
        '<div style="text-align:center;padding:2rem;color:#64748b;">Ongeldige pagina-URL.</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Niet gevonden");

    const data = await res.json();
    const company = data.company || data.item || data;

    if (!company) throw new Error("Leeg resultaat");

    renderCompany(company);
  } catch (err) {
    console.error("❌ company.js:", err);
    if (card) {
      card.innerHTML =
        '<div style="text-align:center;padding:2rem;color:#64748b;">Bedrijf niet gevonden.</div>';
    }
  }
}

function renderCompany(company) {
  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const taglineEl = document.getElementById("companyTagline");
  const servicesEl = document.getElementById("companyServices");
  const hoursEl = document.getElementById("companyHours");
  const reviewsEl = document.getElementById("companyReviews");
  const verifiedBadge = document.getElementById("verifiedBadge");

  const name = company.name || "Onbekend bedrijf";
  const city = company.city || "";
  const categories = Array.isArray(company.categories) ? company.categories : [];
  const tagline =
    company.tagline ||
    company.description ||
    "Dit bedrijf biedt professionele dienstverlening in deze regio.";

  if (nameEl) nameEl.textContent = name;
  if (taglineEl) taglineEl.textContent = tagline;

  if (verifiedBadge) {
    if (company.isVerified) verifiedBadge.classList.remove("hidden");
    else verifiedBadge.classList.add("hidden");
  }

  // META
  if (metaEl) {
    metaEl.innerHTML = "";

    if (city) metaEl.appendChild(makeChip(city));
    if (categories.length) metaEl.appendChild(makeChip(categories[0]));
  }

  // DIENSTEN
  if (servicesEl) {
    servicesEl.innerHTML = "";

    const services = Array.isArray(company.services) ? company.services : [];

    if (services.length === 0) {
      servicesEl.innerHTML =
        '<div style="color:#64748b;font-size:13px;">Dit bedrijf heeft zijn diensten nog niet volledig ingevuld. Op basis van het profiel kun je denken aan standaard werkzaamheden binnen deze categorie.</div>';
    } else {
      services.forEach((s) => servicesEl.appendChild(makeChip(s)));
    }
  }

  // OPENINGSTIJDEN
  if (hoursEl) {
    hoursEl.innerHTML = "";

    const hours = company.openingHours || company.hours;

    if (!hours) {
      hoursEl.innerHTML =
        '<div style="color:#64748b;font-size:13px;">Dit bedrijf werkt op afspraak. Neem contact op voor actuele beschikbaarheid.</div>';
    } else if (typeof hours === "object") {
      Object.entries(hours).forEach(([day, val]) => {
        const row = document.createElement("div");
        row.style.fontSize = "13px";
        row.textContent = `${day}: ${val}`;
        hoursEl.appendChild(row);
      });
    }
  }

  // REVIEWS
  if (reviewsEl) {
    reviewsEl.innerHTML = "";

    const reviews = Array.isArray(company.reviews) ? company.reviews : [];

    if (reviews.length === 0) {
      reviewsEl.innerHTML =
        '<div style="color:#64748b;font-size:13px;">Dit bedrijf is recent toegevoegd aan Irisje.nl. De eerste klantenreviews worden binnenkort verwacht.</div>';
    } else {
      reviews.forEach((r) => {
        const div = document.createElement("div");
        div.style.border = "1px solid #e5e7eb";
        div.style.borderRadius = "10px";
        div.style.padding = "10px";
        div.style.marginBottom = "8px";
        div.textContent = r.comment || "";
        reviewsEl.appendChild(div);
      });
    }
  }
}

function makeChip(text) {
  const span = document.createElement("span");
  span.textContent = text;
  span.style.display = "inline-flex";
  span.style.alignItems = "center";
  span.style.padding = "4px 8px";
  span.style.borderRadius = "999px";
  span.style.background = "#f1f5f9";
  span.style.fontSize = "12px";
  span.style.marginRight = "6px";
  return span;
}
