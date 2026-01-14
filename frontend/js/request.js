// frontend/js/request.js
(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";
  const form = document.getElementById("requestForm");
  const sectorSelect = document.getElementById("sector");
  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");

  if (!form || !sectorSelect) return;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    disableSubmit(true);
    setStatus("Categorieën laden…");
    try {
      const categories = await loadCategoriesWithFallbacks();
      populateSelect(categories);
      clearStatus();
      disableSubmit(false);
    } catch (e) {
      showError(
        "sector",
        "Categorieën konden niet worden geladen. Probeer de pagina te verversen."
      );
      setStatus("Categorieën laden mislukt.");
      disableSubmit(true);
    }
  }

  async function loadCategoriesWithFallbacks() {
    // 1) /categories
    const a = await tryGet(`${API_BASE}/categories`);
    if (Array.isArray(a) && a.length) return normalizeCategoryNames(a);

    // 2) /companies/categories
    const b = await tryGet(`${API_BASE}/companies/categories`);
    if (Array.isArray(b) && b.length) return normalizeCategoryNames(b);

    // 3) /companies -> unieke categorieën afleiden
    const c = await tryGet(`${API_BASE}/companies`);
    if (Array.isArray(c) && c.length) {
      const set = new Set();
      c.forEach(co => {
        if (co && typeof co === "object") {
          if (co.category) set.add(co.category);
          if (co.sector) set.add(co.sector);
        }
      });
      const derived = Array.from(set).filter(Boolean);
      if (derived.length) return derived;
    }

    throw new Error("no_categories_found");
  }

  async function tryGet(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function normalizeCategoryNames(arr) {
    // accepteert: [{name}], [{title}], ["Naam"]
    return arr
      .map(x => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") return x.name || x.title || null;
        return null;
      })
      .filter(Boolean);
  }

  function populateSelect(names) {
    sectorSelect.innerHTML = '<option value="">Kies een categorie</option>';
    names.forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sectorSelect.appendChild(opt);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const sector = sectorSelect.value.trim();
    const city = document.getElementById("city").value.trim();
    const description = document.getElementById("description").value.trim();

    let hasError = false;
    if (!sector) { showError("sector", "Kies een categorie."); hasError = true; }
    if (!city)   { showError("city", "Vul een plaats of postcode in."); hasError = true; }
    if (hasError) return;

    disableSubmit(true);
    setStatus("Aanvraag wordt gestart…");

    try {
      const response = await fetch(`${API_BASE}/publicRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, city, description })
      });
      if (!response.ok) throw new Error("request_failed");
      const data = await response.json();
      if (!data || !data._id) throw new Error("invalid_response");

      sessionStorage.setItem("requestId", data._id);
      window.location.href = `results.html?requestId=${data._id}`;
    } catch {
      setStatus("Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw.");
      disableSubmit(false);
    }
  });

  function disableSubmit(disabled) { if (submitBtn) submitBtn.disabled = disabled; }
  function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }
  function clearStatus() { if (statusEl) statusEl.textContent = ""; }

  function showError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  }
  function clearErrors() {
    document.querySelectorAll(".error-text").forEach(e => (e.textContent = ""));
    clearStatus();
  }
})();
