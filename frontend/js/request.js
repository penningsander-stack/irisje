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
    await loadCategories();
    clearStatus();
  }

  async function loadCategories() {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      if (!res.ok) throw new Error("categories_fetch_failed");

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("categories_empty");
      }

      // reset select
      sectorSelect.innerHTML =
        '<option value="">Kies een categorie</option>';

      data.forEach(cat => {
        if (!cat || !cat.name) return;
        const opt = document.createElement("option");
        opt.value = cat.name;
        opt.textContent = cat.name;
        sectorSelect.appendChild(opt);
      });

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const sector = sectorSelect.value.trim();
    const city = document.getElementById("city").value.trim();
    const description = document.getElementById("description").value.trim();

    let hasError = false;

    if (!sector) {
      showError("sector", "Kies een categorie.");
      hasError = true;
    }
    if (!city) {
      showError("city", "Vul een plaats of postcode in.");
      hasError = true;
    }
    if (hasError) return;

    disableSubmit(true);
    setStatus("Aanvraag wordt gestart…");

    try {
      const response = await fetch(
        `${API_BASE}/publicRequests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sector, city, description })
        }
      );

      if (!response.ok) throw new Error("request_failed");

      const data = await response.json();
      if (!data || !data._id) throw new Error("invalid_response");

      sessionStorage.setItem("requestId", data._id);
      window.location.href = `results.html?requestId=${data._id}`;
    } catch (err) {
      setStatus(
        "Er ging iets mis bij het starten van je aanvraag. Probeer het opnieuw."
      );
      disableSubmit(false);
    }
  });

  function disableSubmit(disabled) {
    if (submitBtn) submitBtn.disabled = disabled;
  }

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function clearStatus() {
    if (statusEl) statusEl.textContent = "";
  }

  function showError(field, message) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = message;
  }

  function clearErrors() {
    document.querySelectorAll(".error-text").forEach(e => (e.textContent = ""));
    clearStatus();
  }
})();
