// frontend/js/company.js
// v20251225-COMPANY-ID-BASED-STABLE
//
// Definitieve ID-based company profile loader.
// Sluit aan op results.js (company.html?id=...)
// Geen slug-logica meer.

const API_BASE = "https://irisje-backend.onrender.com/api";
const BACKEND_BASE = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyDetail();
});

async function initCompanyDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const card = document.getElementById("companyCard");

  if (!id) {
    if (card) {
      card.innerHTML =
        '<div style="text-align:center;padding:2rem;color:#64748b;">Ongeldige pagina-URL (geen bedrijfs-ID).</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const company = data && (data.company || data);

    if (!company || company.ok === false) {
      throw new Error("Bedrijf niet gevonden");
    }

    renderCompany(company);
  } catch (err) {
    console.error("❌ company.js fout:", err);
    if (card) {
      card.innerHTML =
        '<div style="text-align:center;padding:2rem;color:#64748b;">Bedrijf niet gevonden.</div>';
    }
  }
}

/* ================================
   Rendering
================================ */

function renderCompany(company) {
  const logoEl = document.getElementById("companyLogo");
  const fallbackEl = document.getElementById("companyLogoFallback");
  const nameEl = document.getElementById("companyName");
  const metaEl = document.getElementById("companyMeta");
  const taglineEl = document.getElementById("companyTagline");
  const verifiedBadge = document.getElementById("verifiedBadge");
  const servicesEl = document.getElementById("companyServices");
  const hoursEl = document.getElementById("companyHours");
  const reviewsEl = document.getElementById("companyReviews");

  const name = company.name || "(Naam onbekend)";
  const city = company.city || "";
  const categories = Array.isArray(company.categories) ? company.categories : [];
  const description =
    company.tagline ||
    company.description ||
    "Geen beschrijving beschikbaar.";

  const rating = Number(company.avgRating) || 0;
  const reviewCount = Number(company.reviewCount) || 0;

  /* Logo */
  if (logoEl) {
    let logo = company.logo || "";
    if (logo) {
      if (!logo.startsWith("http")) {
        logo = BACKEND_BASE + "/" + logo.replace(/^\/+/, "");
      }
      logoEl.src = logo;
      logoEl.alt = name;
      logoEl.classList.remove("hidden");
      if (fallbackEl) fallbackEl.style.display = "none";
    } else {
      logoEl.classList.add("hidden");
      if (fallbackEl) {
        fallbackEl.textContent = name.charAt(0).toUpperCase();
        fallbackEl.style.display = "flex";
      }
    }
  }

  if (nameEl) nameEl.textContent = name;

  /* Meta */
  if (metaEl) {
    metaEl.innerHTML = "";

    if (categories.length) metaEl.appendChild(makeBadge(categories.join(", ")));
    if (city) metaEl.appendChild(makeBadge(city));

    if (reviewCount > 0) {
      const ratingBadge = document.createElement("span");
      ratingBadge.style.cssText =
        "display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;background:#fffbeb;color:#92400e;font-size:12px;";
      ratingBadge.innerHTML =
        `<span style="color:#f59e0b;font-size:16px;">${renderStars(rating)}</span>
         <span style="margin-left:6px;">${rating.toFixed(1)} • ${reviewCount} reviews</span>`;
      metaEl.appendChild(ratingBadge);
    }
  }

  if (verifiedBadge) {
    verifiedBadge.classList.toggle("hidden", !company.isVerified);
  }

  if (taglineEl) taglineEl.textContent = description;

  /* Services */
  if (servicesEl) {
    servicesEl.innerHTML = "";
    const services = Array.isArray(company.services) ? company.services : [];
    if (!services.length) {
      servicesEl.textContent = "Geen diensten opgegeven.";
    } else {
      services.forEach((s) => servicesEl.appendChild(makeBadge(s)));
    }
  }

  /* Openingstijden */
  if (hoursEl) {
    hoursEl.innerHTML = "";
    const hours = company.openingHours || company.hours;
    if (!hours) {
      hoursEl.textContent = "Geen openingstijden bekend.";
    } else if (typeof hours === "object") {
      Object.entries(hours).forEach(([day, val]) => {
        const row = document.createElement("div");
        row.textContent = `${day}: ${val}`;
        hoursEl.appendChild(row);
      });
    }
  }

  /* Reviews */
  if (reviewsEl) {
    reviewsEl.innerHTML = "";
    const reviews = Array.isArray(company.reviews) ? company.reviews : [];
    if (!reviews.length) {
      reviewsEl.textContent = "Nog geen reviews.";
    } else {
      reviews.forEach((r) => {
        const box = document.createElement("div");
        box.style.cssText =
          "border:1px solid #e5e7eb;border-radius:12px;padding:10px;margin-bottom:8px;";
        box.innerHTML =
          `<strong>${escapeHtml(r.name || "Anoniem")}</strong><br>
           <span style="color:#f59e0b;">${renderStars(r.rating)}</span><br>
           <span>${escapeHtml(r.comment || "")}</span>`;
        reviewsEl.appendChild(box);
      });
    }
  }
}

/* ================================
   Helpers
================================ */

function makeBadge(text) {
  const s = document.createElement("span");
  s.textContent = text;
  s.style.cssText =
    "display:inline-flex;align-items:center;padding:4px 8px;border-radius:8px;background:#f1f5f9;color:#334155;font-size:12px;margin-right:6px;";
  return s;
}

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(r) + "☆".repeat(5 - r);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
