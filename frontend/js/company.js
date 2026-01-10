// frontend/js/company.js
// v20260115-COMPANY-ID-OR-SLUG

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initCompany);

async function initCompany() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const slug = params.get("slug");

  if (!id && !slug) {
    console.error("❌ company id of slug ontbreekt in URL");
    renderError("Bedrijf niet gevonden.");
    return;
  }

  try {
    let url;
    if (id) {
      // Publiek ophalen via ID
      url = `${API_BASE}/companies/${encodeURIComponent(id)}`;
    } else {
      // Publiek ophalen via slug
      url = `${API_BASE}/companies/slug/${encodeURIComponent(slug)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Company load error");

    const json = await res.json();
    const company = json.item || json.company || json;

    if (!company || !company._id) {
      renderError("Bedrijf niet gevonden.");
      return;
    }

    renderCompany(company);
  } catch (err) {
    console.error("❌ Company load error:", err);
    renderError("Bedrijf kon niet worden geladen.");
  }
}

function renderCompany(company) {
  // Titel
  setText("companyName", company.name);
  setText("companyCity", company.city || "");

  // Over dit bedrijf → introduction
  if (company.introduction) {
    setText("companyIntroduction", company.introduction);
    show("sectionAbout");
  } else {
    hide("sectionAbout");
  }

  // Waarom kiezen → reasons[]
  if (Array.isArray(company.reasons) && company.reasons.length) {
    const ul = document.getElementById("companyReasons");
    ul.innerHTML = "";
    company.reasons.forEach(r => {
      const li = document.createElement("li");
      li.textContent = r;
      ul.appendChild(li);
    });
    show("sectionReasons");
  } else {
    hide("sectionReasons");
  }

  // Diensten & expertise → specialties[]
  if (Array.isArray(company.specialties) && company.specialties.length) {
    const ul = document.getElementById("companySpecialties");
    ul.innerHTML = "";
    company.specialties.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      ul.appendChild(li);
    });
    show("sectionSpecialties");
  } else {
    hide("sectionSpecialties");
  }

  // Reviews
  if (company.reviewCount > 0) {
    show("sectionReviews");
  } else {
    hide("sectionReviews");
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

function renderError(message) {
  const el = document.getElementById("companyError");
  if (el) {
    el.textContent = message;
    el.classList.remove("hidden");
  }
}
