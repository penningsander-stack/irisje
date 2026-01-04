// frontend/js/company.js
// Laadt één bedrijf:
// - via ?company=ID  → GET /api/publicCompanies/:id
// - anders via ?slug= → GET /api/companies/slug/:slug
// Bestaand slug-gedrag blijft intact.

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initCompanyPage();
});

async function initCompanyPage() {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("company");
  const slug = params.get("slug");

  try {
    let data;

    if (companyId) {
      // Nieuw pad: ophalen op ID (publiek)
      data = await safeJsonFetch(`${API_BASE}/publicCompanies/${encodeURIComponent(companyId)}`);
      if (!data || !data.ok || !data.company) {
        throw new Error("Bedrijf niet gevonden (ID)");
      }
      renderCompany(data.company);
      return;
    }

    if (slug) {
      // Bestaand pad: ophalen op slug
      data = await safeJsonFetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
      // Sommige endpoints geven { company }, andere { item }
      const company = data.company || data.item;
      if (!company) {
        throw new Error("Bedrijf niet gevonden (slug)");
      }
      renderCompany(company);
      return;
    }

    throw new Error("Geen company-id of slug in de URL");
  } catch (err) {
    console.error("❌ Company laden mislukt:", err);
    showError("Het bedrijf kon niet worden geladen.");
  }
}

async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Geen geldige JSON (${res.status})`);
  }
  if (!res.ok) {
    const msg = (json && json.error) ? json.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

function renderCompany(c) {
  // Verwachte elementen in company.html (ongewijzigd gebruikt):
  // #companyName, #companyTagline, #companyDescription,
  // #companyCity, #companyPhone, #companyEmail, #companyWebsite,
  // #companyCategories, #companyRating

  setText("companyName", c.name);
  setText("companyTagline", c.tagline || "");
  setText("companyDescription", c.description || "");
  setText("companyCity", c.city || "");
  setText("companyPhone", c.phone || "");
  setText("companyEmail", c.email || "");
  setLink("companyWebsite", c.website || "");
  setList("companyCategories", c.categories || []);
  setRating("companyRating", c.avgRating, c.reviewCount);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setLink(id, href) {
  const el = document.getElementById(id);
  if (!el) return;
  if (href) {
    el.href = href;
    el.textContent = href;
    el.style.display = "";
  } else {
    el.style.display = "none";
  }
}

function setList(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  if (!Array.isArray(items) || items.length === 0) {
    el.style.display = "none";
    return;
  }
  el.style.display = "";
  items.forEach(v => {
    const li = document.createElement("li");
    li.textContent = v;
    el.appendChild(li);
  });
}

function setRating(id, avg, count) {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof avg === "number" && typeof count === "number") {
    el.textContent = `${avg.toFixed(1)} (${count})`;
  } else {
    el.textContent = "";
  }
}

function showError(msg) {
  const el = document.getElementById("companyError");
  if (el) {
    el.textContent = msg;
    el.style.display = "";
  } else {
    alert(msg);
  }
}
