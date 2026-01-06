// frontend/js/results.js
// v2026-01-14 UX-MATCH-BADGES

const API_BASE = "https://irisje-backend.onrender.com/api";

const grid = document.getElementById("resultsGrid");
const emptyState = document.getElementById("emptyState");
const explainBox = document.getElementById("explainBox");
const explainText = document.getElementById("explainText");
const resultsIntro = document.getElementById("resultsIntro");

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
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
}

function renderCompanies(companies, request) {
  grid.innerHTML = "";

  companies.forEach((c, index) => {
    const badges = [];

    if (index === 0) {
      badges.push(badge("Beste match", "indigo"));
    }
    if (request.urgency === "direct" && c.canHandleUrgent) {
      badges.push(badge("Snel beschikbaar", "green"));
    }
    if (request.issueType && c.issueTypes?.includes(request.issueType)) {
      badges.push(badge("Ervaring met jouw vraag", "blue"));
    }
    if (request.budgetRange && c.budgetRanges?.includes(request.budgetRange)) {
      badges.push(badge("Past bij je budget", "purple"));
    }

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="bg-white rounded-2xl p-4 shadow-soft">
        <div class="flex flex-wrap gap-2 mb-2">
          ${badges.join("")}
        </div>

        <h3 class="font-semibold text-lg mb-1">${c.name}</h3>
        <p class="text-sm text-slate-600 mb-2">${c.city || ""}</p>

        <div class="text-sm mb-3">
          ⭐ ${c.rating || "-"} (${c.reviewCount || 0} reviews)
        </div>

        <button class="irisje-btn w-full">
          Selecteer bedrijf
        </button>
      </div>
      `
    );
  });
}

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
