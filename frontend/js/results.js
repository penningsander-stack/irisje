// frontend/js/results.js
// v2026-01-06 SHOW-MATCHED-COMPANIES

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  if (!requestId) {
    document.body.innerHTML = "<p>Geen aanvraag gevonden.</p>";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      document.body.innerHTML = "<p>Aanvraag niet gevonden.</p>";
      return;
    }

    renderCompanies(data.companies || []);
  } catch (err) {
    console.error("❌ Results load error:", err);
    document.body.innerHTML = "<p>Fout bij laden resultaten.</p>";
  }
}

function renderCompanies(companies) {
  const container = document.getElementById("results");
  if (!container) return;

  if (!companies.length) {
    container.innerHTML = "<p>Geen bedrijven gevonden.</p>";
    return;
  }

  container.innerHTML = companies
    .map(
      (c) => `
      <article class="company-card">
        <h3>${c.name}</h3>
        <p>${c.city || ""}</p>
        <p>Score: ${c._matchScore}</p>
      </article>
    `
    )
    .join("");
}
