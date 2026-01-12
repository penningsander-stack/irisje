// frontend/js/request.js
// v2026-01-12 — premium request stap 1 + sector/plaats normalisatie (slug->label) + startbedrijf

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  // --- DOM ---
  const form = document.getElementById("step1Form");
  if (!form) return;

  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const messageInput = document.getElementById("messageInput");

  const categorySelect = document.getElementById("categorySelect");   // UI: Sector
  const specialtySelect = document.getElementById("specialtySelect"); // UI: Specialisme
  const formError = document.getElementById("formError");

  const companyBox = document.getElementById("companyBox");
  const companyNameEl = document.getElementById("companyName");
  const companyCityEl = document.getElementById("companyCity");

  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get("companySlug");
  const sectorSlug = params.get("sector"); // vanuit homepage categorie-kaart

  let startCompany = null;

  // --- Sectoren: slug + label (label moet matchen met Company.categories in DB) ---
  const SECTORS = [
    { slug: "aannemer", label: "Aannemer", emoji: "📌" },
    { slug: "advocaat", label: "Advocaat", emoji: "⚖️" },
    { slug: "airco", label: "Airco", emoji: "❄️" },
    { slug: "bouwbedrijf", label: "Bouwbedrijf", emoji: "🔧" },
    { slug: "dakdekker", label: "Dakdekker", emoji: "🏠" },
    { slug: "duurzaam", label: "Duurzaam", emoji: "🌱" },
    { slug: "elektricien", label: "Elektricien", emoji: "🔌" },
    { slug: "glaszetter", label: "Glaszetter", emoji: "🪟" },
    { slug: "hovenier", label: "Hovenier", emoji: "🌳" },
    { slug: "installatie", label: "Installatie", emoji: "📌" },
    { slug: "isolatie", label: "Isolatie", emoji: "🧱" },
    { slug: "juridisch", label: "Juridisch", emoji: "⚖️" },
    { slug: "klusbedrijf", label: "Klusbedrijf", emoji: "🔧" },
    { slug: "loodgieter", label: "Loodgieter", emoji: "💧" },
    { slug: "schilder", label: "Schilder", emoji: "🎨" },
    { slug: "schoonmaakbedrijf", label: "Schoonmaakbedrijf", emoji: "🧹" },
    { slug: "slotenmaker", label: "Slotenmaker", emoji: "🔑" },
    { slug: "spoedservice", label: "Spoedservice", emoji: "🚨" },
    { slug: "stukadoor", label: "Stukadoor", emoji: "📌" },
    { slug: "tegelzetter", label: "Tegelzetter", emoji: "📌" },
    { slug: "timmerman", label: "Timmerman", emoji: "🪚" },
    { slug: "vloeren", label: "Vloeren", emoji: "📐" },
    { slug: "woninginrichting", label: "Woninginrichting", emoji: "🛋️" },
    { slug: "zonnepanelen", label: "Zonnepanelen", emoji: "☀️" },
  ];

  // Specialismes (optioneel; als geen lijst → select blijft disabled)
  const SPECIALTIES = {
    Loodgieter: ["Lekkage", "Verstopping", "CV-ketel", "Spoedservice"],
    Advocaat: ["Arbeidsrecht", "Strafrecht", "Familierecht"],
    Schilder: ["Binnen", "Buiten", "Houtrot"],
    Elektricien: ["Storing", "Groepenkast", "Laadpaal", "Spoedservice"],
    Dakdekker: ["Lekkage", "Dakinspectie", "Dakrenovatie", "Spoedservice"],
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    populateSectors();

    // 1) Als sector via URL is meegegeven (slug), preselect op label
    if (sectorSlug) {
      const match = SECTORS.find(s => s.slug === sectorSlug);
      if (match) {
        categorySelect.value = match.label;
        categorySelect.dispatchEvent(new Event("change"));
      }
    }

    // 2) Als companySlug is meegegeven: startbedrijf ophalen en categorie preselecten + locken
    if (companySlug) {
      await loadStartCompany(companySlug);
    }
  }

  function populateSectors() {
    // behoud placeholder
    const first = categorySelect.querySelector('option[value=""]');
    categorySelect.innerHTML = "";
    if (first) categorySelect.appendChild(first);

    SECTORS.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.label; // BELANGRIJK: label matcht met DB categories
      opt.textContent = `${s.emoji} ${s.label}`;
      categorySelect.appendChild(opt);
    });
  }

  async function loadStartCompany(slug) {
    try {
      const res = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (res.ok && data && data.ok && data.company) {
        startCompany = data.company;

        // toon box
        companyNameEl.textContent = startCompany.name || "";
        companyCityEl.textContent = startCompany.city || "";
        companyBox.classList.remove("hidden");

        // preselect categorie op eerste category van bedrijf (label)
        const firstCat = Array.isArray(startCompany.categories) ? startCompany.categories[0] : "";
        if (firstCat) {
          categorySelect.value = firstCat;
          categorySelect.dispatchEvent(new Event("change"));

          // bij startbedrijf: sector vast (voorkomt mismatch)
          categorySelect.disabled = true;
        }
      }
    } catch (e) {
      console.error("Startcompany load failed:", e);
    }
  }

  // Sector → specialismes
  categorySelect.addEventListener("change", () => {
    const label = categorySelect.value;

    specialtySelect.innerHTML = "";

    const list = SPECIALTIES[label];
    if (!label) {
      specialtySelect.disabled = true;
      specialtySelect.innerHTML = `<option value="">Kies eerst een sector</option>`;
      return;
    }

    if (!list || !Array.isArray(list) || list.length === 0) {
      specialtySelect.disabled = true;
      specialtySelect.innerHTML = `<option value="">Geen specialismes beschikbaar</option>`;
      return;
    }

    specialtySelect.disabled = false;
    specialtySelect.innerHTML = `<option value="">Kies een specialisme (optioneel)</option>`;
    list.forEach(s => {
      const o = document.createElement("option");
      o.value = s;
      o.textContent = s;
      specialtySelect.appendChild(o);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const name = (nameInput.value || "").trim();
    const email = (emailInput.value || "").trim();
    const message = (messageInput.value || "").trim();

    const categoryValue = (categorySelect.value || "").trim(); // label
    const specialtyValue = specialtySelect.disabled ? "" : (specialtySelect.value || "").trim();

    if (!name) return showError("Naam ontbreekt.");
    if (!email) return showError("E-mail ontbreekt.");
    if (!categoryValue) return showError("Kies een sector.");

    const payload = {
      name,
      email,
      message,
      category: categoryValue,
      categories: [categoryValue],
      specialty: specialtyValue,
      specialties: specialtyValue ? [specialtyValue] : [],
      companySlug: companySlug || null,
      // Optie A “plaats”: wordt later door results getoond. (Geen filtering hier.)
      // We laten dit hier bewust weg omdat jouw backend-flow voor publicRequests primair category/specialty gebruikt.
      // Als jij city ook in request wilt opslaan in deze flow, pakken we dat als aparte stap.
    };

    try {
      const res = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data || !data.ok || !data.requestId) {
        return showError("Aanvraag mislukt. Probeer het opnieuw.");
      }

      window.location.href = `/results.html?requestId=${encodeURIComponent(data.requestId)}`;
    } catch (err) {
      console.error(err);
      showError("Aanvraag mislukt. Probeer het opnieuw.");
    }
  });

  function showError(msg) {
    if (!formError) return;
    formError.textContent = msg;
    formError.classList.remove("hidden");
  }

  function hideError() {
    if (!formError) return;
    formError.textContent = "";
    formError.classList.add("hidden");
  }
})();
