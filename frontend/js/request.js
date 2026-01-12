// frontend/js/request.js
// Offerte starten bij specifiek bedrijf + tonen startbedrijf

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("step1Form");
  if (!form) return;

  const categorySelect = document.getElementById("categorySelect");
  const specialtySelect = document.getElementById("specialtySelect");

  const companyBox = document.getElementById("companyBox");
  const companyNameEl = document.getElementById("companyName");
  const companyCityEl = document.getElementById("companyCity");

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");

  let startCompany = null;

  const SPECIALTIES = {
    Loodgieter: ["Lekkage", "Verstopping", "CV-ketel", "Spoedservice"],
    Advocaat: ["Arbeidsrecht", "Strafrecht", "Familierecht"],
    Schilder: ["Binnen", "Buiten", "Houtrot"]
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!companySlug) return;

    try {
      const res = await fetch(`${API_BASE}/companies/slug/${companySlug}`);
      const data = await res.json();

      if (res.ok && data.ok && data.company) {
        startCompany = data.company;

        // 🏢 toon startbedrijf
        companyNameEl.textContent = startCompany.name;
        companyCityEl.textContent = startCompany.city || "";
        companyBox.classList.remove("hidden");

        // preselect categorie (optioneel zichtbaar)
        if (startCompany.categories?.length) {
          categorySelect.value = startCompany.categories[0];
          categorySelect.dispatchEvent(new Event("change"));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  // categorie → specialismes
  categorySelect.addEventListener("change", () => {
    const cat = categorySelect.value;
    specialtySelect.innerHTML = "";

    if (!cat || !SPECIALTIES[cat]) {
      specialtySelect.disabled = true;
      specialtySelect.innerHTML = `<option>Kies eerst een categorie</option>`;
      return;
    }

    specialtySelect.disabled = false;
    specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>`;
    SPECIALTIES[cat].forEach(s => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      specialtySelect.appendChild(o);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim();
    const message = form.querySelector('textarea[name="message"]').value.trim();

    let categoryValue = categorySelect.value || "";
    let specialtyValue = specialtySelect.value || "";

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
