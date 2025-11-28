// frontend/js/results.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  // 🔹 Elementen uit de HTML
  const filterForm = document.getElementById("filterForm");
  const filterCategory = document.getElementById("filterCategory");
  const filterCity = document.getElementById("filterCity");
  const filterMessage = document.getElementById("filterMessage");

  const resultsContainer = document.getElementById("resultsContainer");

  const selectionBar = document.getElementById("selectionBar");
  const selectedCountEl = document.getElementById("selectedCount");
  const selectedNamesEl = document.getElementById("selectedNames");
  const openRequestFormBtn = document.getElementById("openRequestForm");
  const clearSelectionBtn = document.getElementById("clearSelection");

  const requestFormBox = document.getElementById("requestFormBox");
  const requestForm = document.getElementById("requestForm");
  const rqName = document.getElementById("rqName");
  const rqEmail = document.getElementById("rqEmail");
  const rqPhone = document.getElementById("rqPhone");
  const rqMessage = document.getElementById("rqMessage");
  const rqStatus = document.getElementById("rqStatus");
  const submitRequestBtn = document.getElementById("submitRequestBtn");

  const errName = document.getElementById("errName");
  const errEmail = document.getElementById("errEmail");
  const errPhone = document.getElementById("errPhone");
  const errMessage = document.getElementById("errMessage");

  // Als de basis-elementen ontbreken, geen JS uitvoeren
  if (!resultsContainer || !filterForm) {
    console.error("[results.js] Vereiste elementen ontbreken op de pagina.");
    return;
  }

  // 🔹 Geselecteerde bedrijven (max. 5)
  let selectedCompanies = []; // { id, name }

  // 🔹 URL-params uitlezen om de initiële zoekopdracht in te vullen
  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";
  const initialCity = params.get("city") || "";

  if (filterCategory && initialCategory) filterCategory.value = initialCategory;
  if (filterCity && initialCity) filterCity.value = initialCity;

  // ============================================================
  // HELPER FUNCTIES
  // ============================================================

  function setFilterMessage(text) {
    if (filterMessage) {
      filterMessage.textContent = text || "";
    }
  }

  function showResultsMessage(text) {
    resultsContainer.innerHTML = `<p class="mt-2" style="font-size:.9rem;color:#6b7280;">${text}</p>`;
  }

  function updateSelectionBar() {
    const count = selectedCompanies.length;

    if (count === 0) {
      // Balk verbergen
      selectionBar?.classList.add("hidden");
      if (selectionBar) selectionBar.style.display = "none";
      if (selectedCountEl) selectedCountEl.textContent = "0";
      if (selectedNamesEl) selectedNamesEl.textContent = "";
      if (openRequestFormBtn) openRequestFormBtn.disabled = true;
      return;
    }

    // Balk tonen
    selectionBar?.classList.remove("hidden");
    if (selectionBar) selectionBar.style.display = "flex";

    if (selectedCountEl) selectedCountEl.textContent = String(count);
    if (selectedNamesEl) {
      const names = selectedCompanies.map((c) => c.name).join(", ");
      selectedNamesEl.textContent = names;
    }

    if (openRequestFormBtn) openRequestFormBtn.disabled = count === 0;
  }

  function toggleCompanySelection(company) {
    const existingIndex = selectedCompanies.findIndex((c) => c.id === company.id);

    if (existingIndex !== -1) {
      // Al geselecteerd → deselecteren
      selectedCompanies.splice(existingIndex, 1);
    } else {
      if (selectedCompanies.length >= 5) {
        alert("Je kunt maximaal 5 bedrijven selecteren voor een aanvraag.");
        return;
      }
      selectedCompanies.push(company);
    }

    updateSelectionBar();
    syncCheckboxStates();
  }

  function syncCheckboxStates() {
    // Alle checkboxes met data-company-id syncen met selectedCompanies
    const checkboxes = document.querySelectorAll(
      'input[type="checkbox"][data-company-id]'
    );
    checkboxes.forEach((cb) => {
      const id = cb.getAttribute("data-company-id");
      cb.checked = !!selectedCompanies.find((c) => c.id === id);
    });
  }

  function clearSelection() {
    selectedCompanies = [];
    updateSelectionBar();
    syncCheckboxStates();
  }

  function validateEmail(value) {
    if (!value) return false;
    // Simpele e-mailcheck
    return /\S+@\S+\.\S+/.test(value);
  }

  function validatePhone(value) {
    if (!value) return false;
    const digits = value.replace(/\D/g, "");
    return digits.length >= 8;
  }

  function clearFormErrors() {
    if (errName) errName.textContent = "";
    if (errEmail) errEmail.textContent = "";
    if (errPhone) errPhone.textContent = "";
    if (errMessage) errMessage.textContent = "";
  }

  function setStatus(text, isError = false) {
    if (!rqStatus) return;
    rqStatus.textContent = text || "";
    rqStatus.style.color = isError ? "#dc2626" : "#16a34a";
  }

  // ============================================================
  // BEDRIJVEN LADEN EN TONEN
  // ============================================================

  async function loadCompaniesFromApi(category, city) {
    try {
      const qs = new URLSearchParams();
      if (category) qs.set("category", category);
      if (city) qs.set("city", city);

      const url =
        qs.toString().length > 0
          ? `${API_BASE}/companies/search?${qs.toString()}`
          : `${API_BASE}/companies`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server gaf status ${res.status}`);
      }

      const json = await res.json();

      // Backend kan ofwel { items: [...] } of alleen een array teruggeven
      if (Array.isArray(json.items)) {
        return json.items;
      }
      if (Array.isArray(json)) {
        return json;
      }

      console.warn("[results.js] Onbekend responseformaat:", json);
      return [];
    } catch (err) {
      console.error("[results.js] Fout bij ophalen bedrijven:", err);
      throw err;
    }
  }

  function renderCompanies(companies, category, city) {
    if (!resultsContainer) return;

    resultsContainer.innerHTML = "";

    if (!companies || companies.length === 0) {
      showResultsMessage(
        "Er zijn geen bedrijven gevonden die aan deze zoekopdracht voldoen."
      );
      setFilterMessage("");
      return;
    }

    // Kleine samenvatting boven de resultaten
    const total = companies.length;
    let summary = `${total} bedrijf${total === 1 ? "" : "fen"} gevonden`;
    if (category) summary += ` voor “${category}”`;
    if (city) summary += ` in “${city}”`;
    summary += ".";
    setFilterMessage(summary);

    companies.forEach((company) => {
      const card = document.createElement("article");
      card.className = "card company-card";

      const id = company._id || company.id || "";
      const name = company.name || "Onbekend bedrijf";
      const cityName = company.city || "";
      const tagline = company.tagline || company.shortDescription || "";
      const rating =
        typeof company.avgRating === "number"
          ? company.avgRating.toFixed(1)
          : null;
      const reviewCount = company.reviewCount || 0;
      const slug = company.slug;

      const categories = Array.isArray(company.categories)
        ? company.categories
        : company.category
        ? [company.category]
        : [];

      let link = "company.html";
      if (slug) {
        link += `?slug=${encodeURIComponent(slug)}`;
      } else if (id) {
        link += `?id=${encodeURIComponent(id)}`;
      }

      const ratingText = rating
        ? `${rating}★ (${reviewCount} review${
            reviewCount === 1 ? "" : "s"
          })`
        : reviewCount
        ? `${reviewCount} review${reviewCount === 1 ? "" : "s"}`
        : "";

      card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="company-name">
              <a href="${link}">${name}</a>
            </h2>
            <p class="company-meta">
              ${cityName ? `${cityName}` : ""}
              ${ratingText ? ` · ${ratingText}` : ""}
            </p>
            ${
              tagline
                ? `<p class="company-description mt-1">${tagline}</p>`
                : ""
            }
            ${
              categories.length
                ? `<p class="mt-1 text-sm text-gray-500">Categorieën: ${categories
                    .map((c) => c)
                    .join(", ")}</p>`
                : ""
            }
          </div>
          <div class="text-right">
            <label class="inline-flex items-center gap-1 text-sm">
              <input 
                type="checkbox" 
                data-company-id="${id}" 
                data-company-name="${name}" 
              />
              <span>Selecteer</span>
            </label>
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <a class="btn btn-secondary" href="${link}">Bekijk bedrijf</a>
        </div>
      `;

      resultsContainer.appendChild(card);
    });

    // Zorg dat de checkboxes overeenkomen met bestaande selectie
    syncCheckboxStates();
  }

  async function performSearchFromForm() {
    const category = (filterCategory?.value || "").trim();
    const city = (filterCity?.value || "").trim();

    // Querystring bijwerken in de URL
    const urlParams = new URLSearchParams();
    if (category) urlParams.set("category", category);
    if (city) urlParams.set("city", city);
    const newQs = urlParams.toString();
    const newUrl =
      window.location.pathname + (newQs.length ? `?${newQs}` : "");
    window.history.replaceState(null, "", newUrl);

    // Ophalen
    showResultsMessage("Resultaten worden geladen…");
    setFilterMessage("");

    try {
      const companies = await loadCompaniesFromApi(category, city);
      renderCompanies(companies, category, city);
    } catch (err) {
      console.error(err);
      showResultsMessage(
        "Er ging iets mis bij het ophalen van de bedrijven. Probeer het later opnieuw."
      );
      setFilterMessage("");
    }
  }

  // ============================================================
  // AANVRAAG VERSTUREN
  // ============================================================

  async function sendRequest() {
    if (!selectedCompanies.length) {
      setStatus("Selecteer eerst één of meer bedrijven.", true);
      return;
    }

    const name = (rqName?.value || "").trim();
    const email = (rqEmail?.value || "").trim();
    const phone = (rqPhone?.value || "").trim();
    const message = (rqMessage?.value || "").trim();
    const category = (filterCategory?.value || "").trim();
    const city = (filterCity?.value || "").trim();

    clearFormErrors();
    setStatus("");

    let hasError = false;

    if (!name) {
      hasError = true;
      if (errName) errName.textContent = "Vul je naam in.";
    }
    if (!email || !validateEmail(email)) {
      hasError = true;
      if (errEmail) errEmail.textContent = "Vul een geldig e-mailadres in.";
    }
    if (!phone || !validatePhone(phone)) {
      hasError = true;
      if (errPhone) errPhone.textContent =
        "Vul een geldig telefoonnummer in (minimaal 8 cijfers).";
    }
    if (!message) {
      hasError = true;
      if (errMessage) errMessage.textContent =
        "Beschrijf kort waar je hulp bij nodig hebt.";
    }

    if (hasError) {
      setStatus("Controleer de velden hierboven en probeer het opnieuw.", true);
      return;
    }

    const companyIds = selectedCompanies.map((c) => c.id).filter(Boolean);

    if (!companyIds.length) {
      setStatus("Er ging iets mis met de geselecteerde bedrijven.", true);
      return;
    }

    setStatus("Je aanvraag wordt verstuurd…", false);
    if (submitRequestBtn) submitRequestBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          companyIds,
          category,
          city,
          source: "results-page",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server gaf status ${res.status}`);
      }

      // We veronderstellen dat de backend JSON terugstuurt
      await res.json().catch(() => null);

      setStatus(
        "Je aanvraag is verstuurd naar de geselecteerde bedrijven. Zij nemen zo snel mogelijk contact met je op.",
        false
      );

      // Formulier (licht) resetten
      if (requestForm) requestForm.reset();
      clearFormErrors();
      // selectie laten staan zodat je ziet naar wie het is gegaan
    } catch (err) {
      console.error("[results.js] Fout bij versturen aanvraag:", err);
      setStatus(
        "Er ging iets mis bij het versturen van je aanvraag. Probeer het later opnieuw.",
        true
      );
    } finally {
      if (submitRequestBtn) submitRequestBtn.disabled = false;
    }
  }

  // ============================================================
  // EVENT LISTENERS
  // ============================================================

  // Zoeken via formulier
  filterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    performSearchFromForm();
  });

  // Klikken op checkboxes in de resultaten
  resultsContainer.addEventListener("change", (e) => {
    const target = e.target;
    if (
      target &&
      target instanceof HTMLInputElement &&
      target.type === "checkbox" &&
      target.hasAttribute("data-company-id")
    ) {
      const id = target.getAttribute("data-company-id");
      const name = target.getAttribute("data-company-name") || "Onbekend bedrijf";
      if (!id) return;
      toggleCompanySelection({ id, name });
    }
  });

  // Selectie wissen
  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener("click", () => {
      clearSelection();
    });
  }

  // Offerteformulier openen
  if (openRequestFormBtn) {
    openRequestFormBtn.addEventListener("click", () => {
      if (!selectedCompanies.length) {
        alert("Selecteer eerst één of meer bedrijven.");
        return;
      }
      requestFormBox?.classList.remove("hidden");
      if (requestFormBox) requestFormBox.style.display = "block";
      requestFormBox?.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Aanvraag versturen (formulier submit)
  if (requestForm) {
    requestForm.addEventListener("submit", (e) => {
      e.preventDefault();
      sendRequest();
    });
  }

  // ============================================================
  // INITIËLE LOAD
  // ============================================================

  // Direct bij het laden zoeken op basis van URL-parameters
  (async () => {
    const category = (filterCategory?.value || "").trim();
    const city = (filterCity?.value || "").trim();

    showResultsMessage("Resultaten worden geladen…");
    setFilterMessage("");

    try {
      const companies = await loadCompaniesFromApi(category, city);
      renderCompanies(companies, category, city);
    } catch (err) {
      console.error(err);
      showResultsMessage(
        "Er ging iets mis bij het ophalen van de bedrijven. Probeer het later opnieuw."
      );
    }
  })();
});
