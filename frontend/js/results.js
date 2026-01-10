// frontend/js/results.js

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const grid = document.getElementById("resultsGrid");
  grid.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/companies/search`);
    const json = await res.json();
    const results = Array.isArray(json.results) ? json.results : [];

    if (!results.length) {
      grid.innerHTML = "<p class='text-slate-600'>Geen bedrijven gevonden.</p>";
      return;
    }

    results.forEach(c => {
      const card = document.createElement("div");
      card.className = "rounded-2xl bg-white shadow-sm border border-slate-200 p-5";
      card.innerHTML = `
        <h3 class="font-semibold text-slate-900 mb-1">${c.name}</h3>
        <p class="text-sm text-slate-600 mb-2">${c.city || ""}</p>
        <a href="company.html?slug=${encodeURIComponent(c.slug)}"
           class="text-sm text-indigo-600 hover:underline">
           Bekijk profiel
        </a>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error("Results fout", e);
  }
}
