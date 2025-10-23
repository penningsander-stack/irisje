// frontend/js/results.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const resultsEl = document.getElementById("results");

async function fetchResults() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const city = params.get("city") || "";

  try {
    const res = await fetch(`${API_BASE}/companies/search?q=${q}&city=${city}`);
    const data = await res.json();

    if (!data.ok || data.items.length === 0) {
      resultsEl.innerHTML = "<p>Geen bedrijven gevonden.</p>";
      return;
    }

    resultsEl.innerHTML = data.items
      .map(
        (c) => `
        <div class="card">
          <h2>${c.name}</h2>
          <p>${c.tagline || ""}</p>
          <p><strong>${c.city}</strong></p>
          <p>⭐ ${c.avgRating} (${c.reviewCount} reviews)</p>
          <a href="company.html?slug=${c.slug}">Bekijk profiel →</a>
        </div>`
      )
      .join("");
  } catch (err) {
    resultsEl.innerHTML = "<p>Er ging iets mis bij het ophalen van resultaten.</p>";
    console.error(err);
  }
}

fetchResults();
