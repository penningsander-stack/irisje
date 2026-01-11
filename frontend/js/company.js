// frontend/js/company.js
// v2026-01-11 — Stap F: robuust laden via slug óf id (compatibel met results.html links)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(window.location.search);

  // Historisch heet de queryparam "slug". We ondersteunen nu ook id als fallback.
  const slugOrId = params.get("slug") || params.get("id");

  if (!slugOrId) {
    renderError("Geen bedrijf opgegeven.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies`);
    const data = await res.json();

    // ✅ accepteer meerdere response-vormen (results / companies)
    const companies = Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.companies)
      ? data.companies
      : null;

    if (!res.ok || !Array.isArray(companies)) {
      throw new Error("Kon bedrijven niet laden.");
    }

    const company =
      companies.find(c => String(c.slug || "") === String(slugOrId)) ||
      companies.find(c => String(c._id || c.id || "") === String(slugOrId));

    if (!company) {
      throw new Error("Bedrijf niet gevonden.");
    }

    renderCompany(company);
  } catch (err) {
    renderError(err.message || "Fout bij laden bedrijf.");
  }
}

function renderCompany(company) {
  setText("companyName", company.name);
  setText(
    "companyMeta",
    [company.city, company.isVerified ? "Geverifieerd" : null]
      .filter(Boolean)
      .join(" • ")
  );

  setText(
    "companyRating",
    company.reviewCount
      ? `${Number(company.avgRating || 0).toFixed(1)} ★ (${company.reviewCount} reviews)`
      : "Nog geen reviews"
  );

  setText("companyAbout", company.description || "Geen beschrijving beschikbaar.");

  renderDetails(company);
  renderLogo(company);
  renderPremium(company);
}

function renderDetails(company) {
  const ul = document.getElementById("companyDetails");
  if (!ul) return;

  ul.innerHTML = "";

  addLi(ul, "Plaats", company.city || "—");
  addLi(
    ul,
    "Categorieën",
    Array.isArray(company.categories) && company.categories.length
      ? company.categories.join(", ")
      : "—"
  );
  addLi(
    ul,
    "Specialismen",
    Array.isArray(company.specialties) && company.specialties.length
      ? company.specialties.join(", ")
      : "—"
  );
}

function addLi(ul, label, value) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`;
  ul.appendChild(li);
}

function renderLogo(company) {
  const img = document.getElementById("companyLogo");
  const fallback = document.getElementById("companyLogoFallback");

  if (!img || !fallback) return;

  if (company.logoUrl) {
    img.src = company.logoUrl;
    img.classList.remove("hidden");
    fallback.classList.add("hidden");
  } else {
    fallback.textContent = getInitials(company.name);
    fallback.classList.remove("hidden");
    img.classList.add("hidden");
  }
}

function renderPremium(company) {
  const badge = document.getElementById("premiumBadge");
  if (!badge) return;

  if (company.isPremium) {
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function renderError(msg) {
  const hero = document.getElementById("companyHero");
  if (!hero) return;

  hero.innerHTML = `<div class="text-red-600">${escapeHtml(msg)}</div>`;
}

function getInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
