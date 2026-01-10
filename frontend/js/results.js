// frontend/js/results.js
// v2026-01-17 — Stap 3: categorie-normalisatie (labels → slugs)

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", init);

function normalize(val) {
  return String(val || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(v => normalize(v));
}

async function init() {
  const params = new URLSearchParams(location.search);
  const sectorParam = params.get("sector"); // slug uit URL
  const activeSector = normalize(sectorParam);

  try {
    // haal alle bedrijven op (server-side filters laten we los)
    const res = await fetch(`${API_BASE}/companies`);
    const data = await res.json();

    if (!res.ok || !Array.isArray(data.companies)) {
      renderEmpty("Geen bedrijven gevonden.");
      return;
    }

    // client-side filter met normalisatie
    const filtered = data.companies.filter(c => {
      const cats = normalizeArray(c.categories);
      if (!activeSector) return true;
      return cats.includes(activeSector);
    });

    if (filtered.length === 0) {
      renderEmpty("Geen bedrijven gevonden voor deze sector.");
      return;
    }

    renderCompanies(filtered);
  } catch (err) {
    console.error("Results fout:", err);
    renderEmpty("Kon bedrijven niet laden.");
  }
}

function renderCompanies(companies) {
  const list = document.getElementById("resultsList");
  if (!list) return;

  list.innerHTML = "";

  for (const c of companies) {
    const li = document.createElement("li");
    li.className = "border rounded-lg p-4 mb-3";

    const cats = Array.isArray(c.categories) ? c.categories.join(", ") : "";

    li.innerHTML = `
      <div class="font-semibold">${escapeHtml(c.name || "")}</div>
      <div class="text-sm text-slate-600">${escapeHtml(c.city || "")}</div>
      <div class="text-xs text-slate-500 mt-1">${escapeHtml(cats)}</div>
    `;
    list.appendChild(li);
  }
}

function renderEmpty(msg) {
  const list = document.getElementById("resultsList");
  if (!list) return;
  list.innerHTML = `<div class="text-slate-600">${escapeHtml(msg)}</div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
