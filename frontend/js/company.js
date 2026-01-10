// frontend/js/company.js
// v20260115-COMPANY-SAFE-DOM-BINDING

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompany);

async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    console.error("❌ company slug ontbreekt in URL");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error("Company load error");

    const json = await res.json();
    const company = json.item;

    if (!company) {
      console.error("❌ Company niet gevonden");
      return;
    }

    renderCompany(company);
  } catch (err) {
    console.error("❌ Company load error:", err);
  }
}

function renderCompany(company) {
  setText("companyName", company.name);
  setText("companyCity", company.city);

  // Over dit bedrijf → introduction
  if (company.introduction) {
    setHTMLIfExists("companyIntroduction", company.introduction);
    showIfExists("sectionAbout");
  } else {
    hideIfExists("sectionAbout");
  }

  // Waarom kiezen → reasons[]
  if (Array.isArray(company.reasons) && company.reasons.length) {
    const ul = document.getElementById("companyReasons");
    if (ul) {
      ul.innerHTML = "";
      company.reasons.forEach(r => {
        const li = document.createElement("li");
        li.textContent = r;
        ul.appendChild(li);
      });
      showIfExists("sectionReasons");
    }
  } else {
    hideIfExists("sectionReasons");
  }

  // Diensten & expertise → specialties[]
  if (Array.isArray(company.specialties) && company.specialties.length) {
    const ul = document.getElementById("companySpecialties");
    if (ul) {
      ul.innerHTML = "";
      company.specialties.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        ul.appendChild(li);
      });
      showIfExists("sectionSpecialties");
    }
  } else {
    hideIfExists("sectionSpecialties");
  }
}

/* ---------- helpers (NOOIT crashen) ---------- */

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setHTMLIfExists(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function showIfExists(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function hideIfExists(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}
