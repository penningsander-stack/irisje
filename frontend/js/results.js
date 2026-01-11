// frontend/js/results.js
// v2026-01-17 — Stap P1.2
// - 1 startbedrijf vast geselecteerd
// - max. 4 extra bedrijven aanvinkbaar
// - totaal max. 5
// - bevestigen via "Verstuur aanvraag"

const API_BASE = "https://irisje-backend.onrender.com/api";

const grid = document.getElementById("resultsGrid");
const emptyState = document.getElementById("emptyState");
const intro = document.getElementById("resultsIntro");
const countEl = document.getElementById("resultCount");
const selectedCountEl = document.getElementById("selectedCount");
const submitBtn = document.getElementById("submitBtn");

const fixedBox = document.getElementById("fixedCompanyBox");
const fixedNameEl = document.getElementById("fixedCompanyName");

let selected = new Set();
let fixedCompanyId = null;
let requestId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(location.search);
  requestId = params.get("requestId");

  if (!requestId) {
    showEmpty("Geen aanvraag gevonden.");
    return;
  }

  try {
    // 1️⃣ aanvraag ophalen (om startbedrijf te kennen)
    const reqRes = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const reqData = await reqRes.json();

    if (!reqRes.ok || !reqData.ok || !reqData.request) {
      throw new Error("Aanvraag niet gevonden.");
    }

    const req = reqData.request;

    if (req.companyId) {
      fixedCompanyId = String(req.companyId);
      selected.add(fixedCompanyId);
      fixedBox.classList.remove("hidden");
      fixedNameEl.textContent = req.companyName || "Geselecteerd bedrijf";
    }

    updateSelectedCount();

    // 2️⃣ bedrijven laden (matching)
    const res = await fetch(`${API_BASE}/companies`);
    const data = await res.json();

    const companies = Array.isArray(data.results)
      ? data.results
      : Array.isArray(data.companies)
      ? data.companies
      : [];

    if (companies.length === 0) {
      showEmpty("Geen bedrijven gevonden.");
      return;
    }

    intro.textContent =
      "Je aanvraag is aangemaakt. Je kunt deze ook naar andere geschikte bedrijven sturen.";

    renderCompanies(companies);
    countEl.textContent = `${companies.length} bedrijven gevonden`;
  } catch (e) {
    console.error(e);
    showEmpty("Kon resultaten niet laden.");
  }
}

function renderCompanies(companies) {
  grid.innerHTML = "";

  for (const c of companies) {
    const id = String(c._id || c.id);
    const isFixed = id === fixedCompanyId;

    const card = document.createElement("div");
    card.className =
      "border rounded-xl p-4 bg-white shadow-soft flex items-start gap-3";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "mt-1";
    checkbox.checked = isFixed;
    checkbox.disabled = isFixed;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        if (selected.size >= 5) {
          checkbox.checked = false;
          return;
        }
        selected.add(id);
      } else {
        selected.delete(id);
      }
      updateSelectedCount();
    });

    const info = document.createElement("div");
    info.innerHTML = `
      <div class="font-semibold text-slate-900">${escapeHtml(c.name || "")}</div>
      <div class="text-sm text-slate-600">${escapeHtml(c.city || "")}</div>
      <div class="text-xs text-slate-500">
        ${escapeHtml(Array.isArray(c.categories) ? c.categories.join(", ") : "")}
      </div>
    `;

    card.appendChild(checkbox);
    card.appendChild(info);
    grid.appendChild(card);
  }
}

function updateSelectedCount() {
  selectedCountEl.textContent = selected.size;

  if (selected.size > 0) {
    submitBtn.classList.remove("opacity-50", "pointer-events-none");
  } else {
    submitBtn.classList.add("opacity-50", "pointer-events-none");
  }
}

submitBtn.addEventListener("click", async () => {
  if (selected.size === 0) return;

  try {
    const res = await fetch(`${API_BASE}/publicRequests/${requestId}/recipients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyIds: Array.from(selected),
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert("Versturen mislukt.");
      return;
    }

    alert(`Aanvraag verstuurd naar ${selected.size} bedrijven.`);
  } catch (e) {
    console.error(e);
    alert("Versturen mislukt.");
  }
});

function showEmpty(msg) {
  grid.innerHTML = "";
  emptyState.classList.remove("hidden");
  const p = emptyState.querySelector("p");
  if (p) p.textContent = msg;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
