// frontend/js/request.js
// Optie A + werkend specialisme

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("step1Form");
  if (!form) return;

  const categorySelect = document.getElementById("categorySelect");
  const specialtySelect = document.getElementById("specialtySelect");

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  let startCompany = null;

  // Hardcoded specialismes (kan later uit backend)
  const SPECIALTIES = {
    Loodgieter: [
      "Lekkage",
      "Verstopping",
      "CV-ketel",
      "Dakwerk",
      "Spoedservice"
    ],
    Advocaat: [
      "Arbeidsrecht",
      "Strafrecht",
      "Familierecht",
      "Bestuursrecht"
    ],
    Schilder: [
      "Binnenschilderwerk",
      "Buitenschilderwerk",
      "Behang",
      "Houtrot"
    ]
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!companySlug) return;
    try {
      const res = await fetch(`${API_BASE}/companies/slug/${companySlug}`);
      const data = await res.json();
      if (res.ok && data.ok && data.company) startCompany = data.company;
    } catch (e) {
      console.error(e);
    }
  }

  // 🔥 CATEGORIE → SPECIALISMES
  categorySelect.addEventListener("change", () => {
    const category = categorySelect.value;
    specialtySelect.innerHTML = "";

    if (!category || !SPECIALTIES[category]) {
      specialtySelect.disabled = true;
      specialtySelect.innerHTML = `<option>Kies eerst een categorie</option>`;
      return;
    }

    specialtySelect.disabled = false;
    specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>`;

    SPECIALTIES[category].forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      specialtySelect.appendChild(opt);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const message = form.querySelector('textarea[name="message"]').value.trim();

    let categoryValue = categorySelect.value || "";
    let specialtyValue = specialtySelect.value || "";

    // Fallback categorie vanuit startbedrijf
    if (!categoryValue && startCompany?.categories?.length) {
      categoryValue = startCompany.categories[0];
    }

    if (!categoryValue) {
      alert("Categorie ontbreekt.");
      return;
    }

    const payload = {
      name,
      email,
      message,
      category: categoryValue,
      categories: [categoryValue],
      specialty: specialtyValue,
      specialties: specialtyValue ? [specialtyValue] : [],
      companySlug
    };

    try {
      const res = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.requestId) {
        alert("Aanvraag mislukt.");
        return;
      }
      window.location.href = `/results.html?requestId=${data.requestId}`;
    } catch (e) {
      console.error(e);
      alert("Aanvraag mislukt.");
    }
  });
})();
