// frontend/js/results.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const form = document.getElementById("resultsSearchForm");
  const categoryEl = document.getElementById("resultsCategory");
  const cityEl = document.getElementById("resultsCity");
  const listEl = document.getElementById("resultsList");
  const emptyEl = document.getElementById("resultsEmpty");
  const errorEl = document.getElementById("resultsError");
  const summaryEl = document.getElementById("resultsSummary");

  const params = new URLSearchParams(window.location.search);
  const initialCategory = params.get("category") || "";
  const initialCity = params.get("city") || "";

  if (categoryEl) categoryEl.value = initialCategory;
  if (cityEl) cityEl.value = initialCity;

  function updateSummary(total) {
    const cat = (categoryEl.value || "").trim();
    const city = (cityEl.value || "").trim();
    let text = "";
    if (cat && city) {
      text = `${total} bedrijf${total === 1 ? "" : "fen"} gevonden voor “${cat}” in “${city}”.`;
    } else if (cat) {
      text = `${total} bedrijf${total === 1 ? "" : "fen"} gevonden voor “${cat}”.`;
    } else if (city) {
      text = `${total} bedrijf${total === 1 ? "" : "fen"} gevonden in “${city}”.`;
    } else {
      text = `${total} bedrijf${total === 1 ? "" : "fen"} gevonden.`;
    }
    if (summaryEl) summaryEl.textContent = text;
  }

  function renderList(items) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!items || !items.length) {
      emptyEl && (emptyEl.style.display = "block");
      errorEl && (errorEl.style.display = "none");
      updateSummary(0);
      return;
    }
    emptyEl && (emptyEl.style.display = "none");
    errorEl && (errorEl.style.display = "none");

    items.forEach((c) => {
      const card = document.createElement("article");
      card.className = "card company-card";
      const name = c.name || "(naam onbekend)";
      const city = c.city || "";
      const rating = typeof c.avgRating === "number" ? c.avgRating.toFixed(1) : null;
      const reviewCount = c.reviewCount || 0;
      const shortDesc = c.shortDescription || c.description || "";
      const slug = c.slug;
      const id = c._id;

      let link = "company.html";
      if (slug) {
        link += `?slug=${encodeURIComponent(slug)}`;
      } else if (id) {
        link += `?id=${encodeURIComponent(id)}`;
      }

      card.innerHTML = `
        <h2 class="company-name"><a href="${link}">${name}</a></h2>
        <p class="company-meta">
          ${city ? city : ""} 
          ${rating ? ` · ${rating}★ (${reviewCount} reviews)` : reviewCount ? ` · ${reviewCount} reviews` : ""}
        </p>
        ${
          shortDesc
            ? `<p class="company-description">${shortDesc}</p>`
            : ""
        }
        <a class="btn btn-secondary mt-2" href="${link}">Bekijk bedrijf</a>
      `;
      listEl.appendChild(card);
    });

    updateSummary(items.length);
  }

  function buildSearchUrl() {
    const params = new URLSearchParams();
    const category = (categoryEl.value || "").trim();
    const city = (cityEl.value || "").trim();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    const qs = params.toString();
    return window.location.pathname + (qs ? "?" + qs : "");
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = buildSearchUrl();
      window.history.replaceState(null, "", url);
      loadResults();
    });
  }

  function loadResults() {
    if (!listEl) return;
    listEl.innerHTML = "";
    emptyEl && (emptyEl.style.display = "none");
    errorEl && (errorEl.style.display = "none");

    const category = (categoryEl.value || "").trim();
    const city = (cityEl.value || "").trim();

    let fetchUrl;
    if (!category && !city) {
      fetchUrl = `${API_BASE}/companies/`;
    } else {
      const p = new URLSearchParams();
      if (category) p.set("category", category);
      if (city) p.set("city", city);
      fetchUrl = `${API_BASE}/companies/search?${p.toString()}`;
    }

    fetch(fetchUrl)
      .then((res) => res.json())
      .then((json) => {
        if (!json) {
          throw new Error("Lege response");
        }
        if (Array.isArray(json.items)) {
          renderList(json.items);
        } else if (Array.isArray(json)) {
          renderList(json);
        } else {
          throw new Error("Onbekend antwoordformaat");
        }
      })
      .catch((err) => {
        console.error("Fout bij laden resultaten:", err);
        errorEl && (errorEl.style.display = "block");
        updateSummary(0);
      });
  }

  loadResults();
});
