// frontend/js/results.js
// v2026-01-10 RESULTS-B2-SUBMIT

const API_BASE = "https://irisje-backend.onrender.com/api";
const MAX_SELECTION = 5;

let allCompanies = [];
let selectedIds = new Set();

document.addEventListener("DOMContentLoaded", initResults);

async function initResults() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");

  const skeleton = document.getElementById("resultsSkeleton");
  const container = document.getElementById("resultsContainer");

  try {
    let companies = [];

    if (requestId) {
      const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Aanvraag niet gevonden");
      companies = data.companies || [];
    } else {
      const res = await fetch(`${API_BASE}/publicCompanies`);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Geen bedrijven");
      companies = data.companies || [];
    }

    allCompanies = companies;
    skeleton.style.display = "none";
    applyAndRender();
  } catch (e) {
    skeleton.style.display = "none";
    container.innerHTML = `<p class="text-slate-500">Fout bij laden.</p>`;
  }

  // submit
  const sendBtn = document.getElementById("sendRequestBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", submitSelection);
  }
}

function applyAndRender() {
  const container = document.getElementById("resultsContainer");

  let results = [...allCompanies];
  const minRating = document.getElementById("filterMinRating")?.value || "";
  const verifiedOnly = document.getElementById("filterVerified")?.value || "";
  const sort = document.getElementById("sortResults")?.value || "relevance";

  if (minRating) results = results.filter(c => (c.avgRating || 0) >= Number(minRating));
  if (verifiedOnly === "yes") results = results.filter(c => c.isVerified === true);

  switch (sort) {
    case "rating":
      results.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)); break;
    case "reviews":
      results.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
    case "az":
      results.sort((a, b) => (a.name || "").localeCompare(b.name || "")); break;
  }

  if (!results.length) {
    container.innerHTML = `<div class="col-span-full text-center text-slate-500 py-12">Geen bedrijven gevonden.</div>`;
    return;
  }

  container.innerHTML = results.map(renderCard).join("");
}

function renderCard(company) {
  const isSelected = selectedIds.has(company._id);
  const disabled = !isSelected && selectedIds.size >= MAX_SELECTION;

  return `
    <div class="surface-card p-5 rounded-2xl shadow-soft flex flex-col justify-between
                ${isSelected ? "ring-2 ring-indigo-600" : ""}">
      <div>
        <h3 class="font-semibold text-slate-900 mb-1">${escapeHtml(company.name)}</h3>
        <div class="text-sm text-slate-600 mb-2">
          ${(company.avgRating || "—")} (${company.reviewCount || 0} reviews)
        </div>
        ${company.isVerified ? `<span class="badge-verified">Geverifieerd</span>` : ``}
      </div>

      <button
        class="mt-4 px-4 py-2 rounded-xl text-sm font-medium
          ${isSelected
            ? "bg-indigo-600 text-white"
            : "border border-indigo-600 text-indigo-600 hover:bg-indigo-50"}
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}"
        onclick="toggleSelect('${company._id}')"
        ${disabled ? "disabled" : ""}>
        ${isSelected ? "Geselecteerd" : "Selecteer"}
      </button>
    </div>
  `;
}

window.toggleSelect = function (id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else if (selectedIds.size < MAX_SELECTION) selectedIds.add(id);
  updateSelectionBar();
  applyAndRender();
};

function updateSelectionBar() {
  const bar = document.getElementById("selectionBar");
  const countEl = document.getElementById("selectedCount");
  const btn = document.getElementById("sendRequestBtn");

  countEl.textContent = selectedIds.size;
  btn.disabled = selectedIds.size === 0;
  bar.classList.toggle("hidden", selectedIds.size === 0);
}

async function submitSelection() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return;

  const res = await fetch(`${API_BASE}/publicRequests/${requestId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyIds: Array.from(selectedIds) })
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    alert(data.error || "Versturen mislukt");
    return;
  }

  window.location.href = `/request-confirmation.html`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}

["filterMinRating", "filterVerified", "sortResults"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("change", applyAndRender);
});
