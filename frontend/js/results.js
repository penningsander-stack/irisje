// frontend/js/results.js
// v2026-01-15 UX-BADGES-RATING-SELECTION

const API_BASE = "https://irisje-backend.onrender.com/api";

const grid = document.getElementById("resultsGrid");
const emptyState = document.getElementById("emptyState");
const explainBox = document.getElementById("explainBox");
const explainText = document.getElementById("explainText");
const resultsIntro = document.getElementById("resultsIntro");
const selectedCountEl = document.getElementById("selectedCount");
const submitBtn = document.getElementById("submitBtn");

let selected = new Set();
let requestId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  requestId = params.get("requestId");
  if (!requestId) return;

  const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
  const data = await res.json();
  if (!res.ok || !data.ok) return;

  const { request, companies } = data;

  resultsIntro.textContent =
    `Resultaten voor ${label(request.category)} – ${label(request.specialty)}.`;

  if (!companies || companies.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  explainBox.classList.remove("hidden");
  explainText.textContent =
    " We kijken naar specialisme, ervaring met jouw vraag, beschikbaarheid en reviews.";

  renderCompanies(companies, request);
  updateSelectionUI();
}

function renderCompanies(companies, request) {
  grid.innerHTML = "";

  companies.forEach((c, index) => {
    const badges = [];

    if (index === 0) badges.push(badge("Beste match", "indigo"));
    if (c.verified) badges.push(badge("Geverifieerd", "green"));
    if (request.issueType && c.issueTypes?.includes(request.issueType)) {
      badges.push(badge("Ervaring met jouw vraag", "blue"));
    }
    if (request.urgency === "direct" && c.canHandleUrgent) {
      badges.push(badge("Snel beschikbaar", "purple"));
    }

    const rating = typeof c.rating === "number" ? c.rating.toFixed(1) : "-";
    const reviews = c.reviewCount || 0;

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <label class="bg-white rounded-2xl p-4 shadow-soft cursor-pointer">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex flex-wrap gap-2">
            ${badges.join("")}
          </div>
          <input type="checkbox" class="companyCheck" value="${c._id}">
        </div>

        <h3 class="font-semibold text-lg mb-1">${c.name}</h3>
        <p class="text-sm text-slate-600 mb-2">${c.city || ""}</p>

        <div class="text-sm mb-2">
          ⭐ ${rating} (${reviews} reviews)
        </div>
      </label>
      `
    );
  });

  document.querySelectorAll(".companyCheck").forEach(cb => {
    cb.addEventListener("change", onToggle);
  });
}

function onToggle(e) {
  const id = e.target.value;

  if (e.target.checked) {
    if (selected.size >= 5) {
      e.target.checked = false;
      alert("Je kunt maximaal 5 bedrijven selecteren.");
      return;
    }
    selected.add(id);
  } else {
    selected.delete(id);
  }
  updateSelectionUI();
}

function updateSelectionUI() {
  selectedCountEl.textContent = selected.size;
  if (selected.size > 0) {
    submitBtn.classList.remove("opacity-50", "pointer-events-none");
  } else {
    submitBtn.classList.add("opacity-50", "pointer-events-none");
  }
}

submitBtn.addEventListener("click", async () => {
  if (selected.size === 0) return;

  const res = await fetch(`${API_BASE}/publicRequests/${requestId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyIds: Array.from(selected) })
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    alert(data.error || "Versturen mislukt");
    return;
  }

  alert("Je aanvraag is verstuurd naar de geselecteerde bedrijven.");
});

function badge(text, color) {
  const map = {
    indigo: "bg-indigo-100 text-indigo-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  };
  return `<span class="text-xs px-2 py-1 rounded-full ${map[color]}">${text}</span>`;
}

function label(v) {
  if (!v) return "";
  return v.replace("-", " ");
}
