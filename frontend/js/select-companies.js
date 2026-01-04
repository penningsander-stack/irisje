// frontend/js/select-companies.js
// v20260104-MATCH-SCORE

const API_BASE = "https://irisje-backend.onrender.com/api";

let requestId = "";
let companies = [];
let selectedIds = new Set();

document.addEventListener("DOMContentLoaded", () => {
  initSelectCompanies().catch((err) => {
    console.error("❌ Select-companies fout:", err);
    setStatus(err?.message || "Onbekende fout", true);
  });
});

function setStatus(text, isError = false) {
  const el = document.getElementById("statusBox");
  if (!el) return;
  el.textContent = text || "";
  el.classList.toggle("text-red-600", !!isError);
  el.classList.toggle("text-slate-600", !isError);
}

function getRequestIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("requestId") || "";
}

async function safeJsonFetch(url, options = {}) {
  const res = await fetch(url, options);
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (!ct.includes("application/json")) throw new Error("Geen JSON");
  return res.json();
}

async function initSelectCompanies() {
  requestId = getRequestIdFromUrl();
  if (!requestId) {
    setStatus("Geen requestId in URL.", true);
    return;
  }

  document.getElementById("requestBadge").textContent = `Aanvraag: ${requestId}`;
  setStatus("Bedrijven laden…");

  const data = await safeJsonFetch(`${API_BASE}/publicRequests/${requestId}`);
  companies = Array.isArray(data.companies) ? data.companies : [];

  if (!companies.length) {
    setStatus("Geen bedrijven gevonden.", false);
    renderCompanies([]);
    return;
  }

  setStatus(`Gevonden: ${companies.length} bedrijven (gesorteerd op beste match).`);
  renderCompanies(companies);
  wireActions();
  updateSelectionUI();
}

function renderCompanies(list) {
  const container = document.getElementById("companiesContainer");
  container.innerHTML = "";

  const topScore = list[0]?._matchScore;

  list.forEach((c) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const bestMatch =
      typeof c._matchScore === "number" && c._matchScore === topScore
        ? `<span class="badge-soft badge-best">Beste match</span>`
        : "";

    card.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">${escapeHtml(c.name)}</div>
          <div class="text-xs text-slate-500">Matchscore: ${c._matchScore ?? 0}</div>
        </div>
        ${bestMatch}
      </div>

      <div class="result-footer">
        <label class="checkbox-label">
          <input type="checkbox" data-id="${c._id}" />
          Selecteer
        </label>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const id = cb.dataset.id;
      if (cb.checked) {
        if (selectedIds.size >= 5) {
          cb.checked = false;
          setStatus("Maximaal 5 bedrijven.", true);
          return;
        }
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      updateSelectionUI();
    });
  });
}

function wireActions() {
  document.getElementById("clearSelectionBtn").onclick = () => {
    selectedIds.clear();
    document.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
    updateSelectionUI();
  };
}

function updateSelectionUI() {
  document.getElementById("selectedCount").textContent = `${selectedIds.size} geselecteerd`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
