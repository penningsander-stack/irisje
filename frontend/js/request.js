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
  const companySlugRaw = params.get("companySlug");
  const companySlug = companySlugRaw ? String(companySlugRaw).trim() : "";

  let startCompany = null;

  const SPECIALTIES = {
    Loodgieter: ["Lekkage", "Verstopping", "CV-ketel", "Spoedservice"],
    Advocaat: ["Arbeidsrecht", "Strafrecht", "Familierecht"],
    Schilder: ["Binnen", "Buiten", "Houtrot"],
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    // categorie → specialismes initialiseren (ook zonder startbedrijf)
    categorySelect.dispatchEvent(new Event("change"));

    if (!companySlug) return;

    try {
      const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(companySlug)}`);
      const data = await res.json();

      if (res.ok && data && data.ok && data.company) {
        startCompany = data.company;

        // 🏢 toon startbedrijf
        companyNameEl.textContent = startCompany.name || "";
        companyCityEl.textContent = startCompany.city || "";
        companyBox.classList.remove("hidden");

        // preselect categorie (optioneel)
        if (Array.isArray(startCompany.categories) && startCompany.categories.length) {
          const firstCat = String(startCompany.categories[0] || "").trim();
          if (firstCat) {
            categorySelect.value = firstCat;
            categorySelect.dispatchEvent(new Event("change"));
          }
        }
      }
    } catch (e) {
      console.error("request init error:", e);
    }
  }

  // categorie → specialismes
  categorySelect.addEventListener("change", () => {
    const cat = String(categorySelect.value || "").trim();
    specialtySelect.innerHTML = "";

    if (!cat || !SPECIALTIES[cat]) {
      specialtySelect.disabled = true;
      specialtySelect.innerHTML = `<option value="">Kies eerst een categorie</option>`;
      return;
    }

    specialtySelect.disabled = false;
    specialtySelect.innerHTML = `<option value="">Kies een specialisme</option>`;
    SPECIALTIES[cat].forEach((s) => {
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

    let categoryValue = String(categorySelect.value || "").trim();
    let specialtyValue = String(specialtySelect.value || "").trim();

    // fallback: als startbedrijf categorie heeft maar user niets gekozen
    if (!categoryValue && startCompany && Array.isArray(startCompany.categories) && startCompany.categories.length) {
      categoryValue = String(startCompany.categories[0] || "").trim();
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
      // startbedrijf
      companySlug: companySlug || null,
    };

    try {
      const res = await fetch(`${API_BASE}/publicrequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data || !data.ok || !data.requestId) {
        alert((data && data.message) || "Aanvraag mislukt.");
        return;
      }

      window.location.href = `/results.html?requestId=${encodeURIComponent(data.requestId)}`;
    } catch (err) {
      console.error("request submit error:", err);
      alert("Aanvraag mislukt.");
    }
  });
})();
