// frontend/js/index.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://irisje-backend.onrender.com/api";
  const form = document.getElementById("homeSearchForm");
  const categoryEl = document.getElementById("searchCategory");
  const cityEl = document.getElementById("searchCity");
  const listEl = document.getElementById("homeCompanies");
  const emptyEl = document.getElementById("homeCompaniesEmpty");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      const category = (categoryEl.value || "").trim();
      const city = (cityEl.value || "").trim();
      if (category) params.set("category", category);
      if (city) params.set("city", city);
      const qs = params.toString();
      const url = "results.html" + (qs ? "?" + qs : "");
      window.location.href = url;
    });
  }

  if (!listEl) return;

  fetch(`${API_BASE}/companies/`)
    .then((res) => res.json())
    .then((json) => {
      if (!json || !json.ok || !Array.isArray(json.items)) {
        emptyEl && (emptyEl.style.display = "block");
        return;
      }
      const items = json.items.slice(0, 6);
      if (!items.length) {
        emptyEl && (emptyEl.style.display = "block");
        return;
      }
      emptyEl && (emptyEl.style.display = "none");
      listEl.innerHTML = "";
      items.forEach((c) => {
        const card = document.createElement("article");
        card.className = "card company-card";
        const name = c.name || "(naam onbekend)";
        const city = c.city || "";
        const rating = typeof c.avgRating === "number" ? c.avgRating.toFixed(1) : null;
        const reviewCount = c.reviewCount || 0;
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
        `;
        listEl.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Fout bij laden bedrijven voor homepage:", err);
      emptyEl && (emptyEl.style.display = "block");
    });
});
