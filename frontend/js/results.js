// frontend/js/results.js
// v2026-01-11 — Stap F: bedrijf aanklikbaar maken (results → company)
// Doel: klik op bedrijf → company.html?slug=...

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

function qs(id) {
  return document.getElementById(id);
}

async function init() {
  const params = new URLSearchParams(location.search);
  const activeSector = normalize(params.get("sector"));

  const grid = qs("resultsGrid");
  const emptyState = qs("emptyState");
  const intro = qs("resultsIntro");
  const count = qs("resultCount");

  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/companies`);
    const data = await res.json();

    // ✅ accepteer meerdere response-vormen
    const companies = Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.companies)
      ? data.companies
      : [];

    if (!res.ok || companies.length === 0) {
      showEmpty(grid, emptyState, count, "Geen bedrijven gevonden.");
      return;
    }

    // ✅ alleen filteren als sector écht bestaat
    let filtered = companies;
    if (activeSector) {
      filtered = companies.filter(c => {
        const cats = normalizeArray(c.categories);
        return cats.includes(activeSector);
      });
    }

    if (intro) {
      intro.textContent = activeSector
        ? `Resultaten voor sector: ${activeSector.replace(/-/g, " ")}`
        : "Alle bedrijven";
    }

    if (filtered.length === 0) {
      showEmpty(grid, emptyState, count, "Geen bedrijven gevonden voor deze sector.");
      return;
    }

    hideEmpty(emptyState);
    renderCards(grid, filtered, params);

    if (count) {
      count.textContent = `${filtered.length} bedrijven gevonden`;
    }
  } catch (e) {
    console.error("Results fout:", e);
    showEmpty(grid, emptyState, count, "Kon bedrijven niet laden.");
  }
}

function renderCards(grid, companies, currentParams) {
  grid.innerHTML = "";

  for (const c of companies) {
    // Belangrijk: backend hoort slug te leveren. Als die ontbreekt gebruiken we _id als fallback.
    // company.js kan beide matchen (slug of id).
    const ref = c.slug || c._id || c.id || "";
    const safeRef = encodeURIComponent(String(ref));

    // behoud context (optioneel)
    const extra = new URLSearchParams();
    if (currentParams && currentParams.get("sector")) {
      extra.set("fromSector", currentParams.get("sector"));
    }
    const extraQs = extra.toString() ? `&${extra.toString()}` : "";

    const a = document.createElement("a");
    a.href = `company.html?slug=${safeRef}${extraQs}`;
    a.className = "block border rounded-xl p-4 bg-white shadow-soft hover:shadow-md transition";
    a.setAttribute("aria-label", `Bekijk bedrijf: ${c.name || ""}`);

    a.innerHTML = `
      <div class="font-semibold text-slate-900 mb-1">${escapeHtml(c.name || "")}</div>
      <div class="text-sm text-slate-600 mb-2">${escapeHtml(c.city || "")}</div>
      <div class="text-xs text-slate-500">
        ${escapeHtml(Array.isArray(c.categories) ? c.categories.join(", ") : "")}
      </div>
    `;

    grid.appendChild(a);
  }
}

function showEmpty(grid, emptyState, count, msg) {
  if (grid) grid.innerHTML = "";
  if (count) count.textContent = "";
  if (emptyState) {
    emptyState.classList.remove("hidden");
    const p = emptyState.querySelector("p");
    if (p) p.textContent = msg;
  }
}

function hideEmpty(emptyState) {
  if (emptyState) emptyState.classList.add("hidden");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
