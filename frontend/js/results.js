// frontend/js/results.js
// v2026-01-17 — FIX: juiste response-key + robuuste target-container

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

function getListEl() {
  // Probeer bekende varianten; pak de eerste die bestaat
  return (
    document.getElementById("resultsList") ||
    document.getElementById("companiesList") ||
    document.getElementById("companyList")
  );
}

async function init() {
  const params = new URLSearchParams(location.search);
  const activeSector = normalize(params.get("sector"));

  try {
    const res = await fetch(`${API_BASE}/companies`);
    const data = await res.json();

    // JUISTE KEY
    if (!res.ok || !Array.isArray(data.results)) {
      renderEmpty("Geen bedrijven gevonden.");
      return;
    }

    const filtered = data.results.filter(c => {
      if (!activeSector) return true;
      const cats = normalizeArray(c.categories);
      return cats.includes(activeSector);
    });

    if (filtered.length === 0) {
      renderEmpty("Geen bedrijven gevonden voor deze sector.");
      return;
    }

    renderCompanies(filtered);
  } catch (e) {
    console.error("Results fout:", e);
    renderEmpty("Kon bedrijven niet laden.");
  }
}

function renderCompanies(companies) {
  const list = getListEl();
  if (!list) {
    console.error("Geen results container gevonden in results.html");
    return;
  }

  list.innerHTML = "";

  for (const c of companies) {
    const li = document.createElement("li");
    li.className = "border rounded-lg p-4 mb-3";

    li.innerHTML = `
      <div class="font-semibold">${escapeHtml(c.name || "")}</div>
      <div class="text-sm text-slate-600">${escapeHtml(c.city || "")}</div>
      <div class="text-xs text-slate-500 mt-1">${escapeHtml(
        Array.isArray(c.categories) ? c.categories.join(", ") : ""
      )}</div>
    `;
    list.appendChild(li);
  }
}

function renderEmpty(msg) {
  const list = getListEl();
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
