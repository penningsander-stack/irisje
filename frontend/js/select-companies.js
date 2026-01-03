// frontend/js/select-companies.js
// v20260103-FIX-SELECT-COMPANIES
// - Laadt aanvraag + matches via /api/publicRequests/:id (zelfde origin)
// - Selecteer max 5 bedrijven
// - Versturen via POST /api/publicRequests/:id/send

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

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    if (isJson) {
      const data = await res.json().catch(() => null);
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const text = await res.text().catch(() => "");
    const short = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(`HTTP ${res.status} (geen JSON): ${short}`);
  }

  if (!isJson) {
    const text = await res.text().catch(() => "");
    const short = text.slice(0, 80).replace(/\s+/g, " ");
    throw new Error(`Onverwacht antwoord (geen JSON): ${short}`);
  }

  return res.json();
}

async function initSelectCompanies() {
  requestId = getRequestIdFromUrl();
  if (!requestId) {
    setStatus("Geen requestId in de URL. Open deze pagina via de link na het invullen van het formulier.", true);
    return;
  }

  const badge = document.getElementById("requestBadge");
  if (badge) badge.textContent = `Aanvraag: ${requestId}`;

  setStatus("Bedrijven laden…");

  const data = await safeJsonFetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}`);

  companies = Array.isArray(data.companies) ? data.companies : [];

  if (!companies.length) {
    setStatus("Geen bedrijven gevonden voor deze aanvraag.", false);
    renderCompanies([]);
    wireActions();
    updateSelectionUI();
    return;
  }

  setStatus(`Gevonden: ${companies.length} bedrijven. Selecteer maximaal 5.`, false);

  renderCompanies(companies);
  wireActions();
  updateSelectionUI();
}

function renderCompanies(list) {
  const container = document.getElementById("companiesContainer");
  if (!container) return;

  container.innerHTML = "";

  list.forEach((c) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const rating = typeof c.rating === "number" ? c.rating.toFixed(1) : (c.rating || "—");
    const city = c.city ? String(c.city) : "";
    const premiumBadge = c.premium ? `<span class="badge-soft">Premium</span>` : "";

    card.innerHTML = `
      <div class="result-header">
        <div>
          <div class="result-title">${escapeHtml(c.name || "Bedrijf")}</div>
          <div class="result-location">${escapeHtml(city)}</div>
          <div class="result-categories">${escapeHtml(c.category || "")}</div>
        </div>
        <div class="result-rating">
          <div class="result-stars">★ ${escapeHtml(String(rating))}</div>
          <div class="result-reviewcount">${premiumBadge}</div>
        </div>
      </div>

      <div class="result-footer">
        <label class="checkbox-label">
          <input type="checkbox" data-id="${escapeHtml(String(c._id))}" />
          Selecteer
        </label>
        <div class="result-verified">${c.premium ? "Voorrang in de lijst" : ""}</div>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('input[type="checkbox"][data-id]').forEach((cb) => {
    const id = cb.getAttribute("data-id");
    cb.checked = selectedIds.has(id);

    cb.addEventListener("change", () => {
      if (!id) return;

      if (cb.checked) {
        if (selectedIds.size >= 5) {
          cb.checked = false;
          setStatus("Je kunt maximaal 5 bedrijven selecteren.", true);
          return;
        }
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }

      setStatus("", false);
      updateSelectionUI();
    });
  });
}

function wireActions() {
  const clearBtn = document.getElementById("clearSelectionBtn");
  const sendBtn = document.getElementById("sendBtn");

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      selectedIds = new Set();
      document.querySelectorAll('input[type="checkbox"][data-id]').forEach((cb) => (cb.checked = false));
      setStatus("Selectie gewist.", false);
      updateSelectionUI();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
      try {
        if (!requestId) throw new Error("Geen requestId gevonden.");

        const ids = Array.from(selectedIds);
        if (ids.length < 1) throw new Error("Selecteer minimaal 1 bedrijf.");

        setStatus("Versturen…");

        const data = await safeJsonFetch(`${API_BASE}/publicRequests/${encodeURIComponent(requestId)}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyIds: ids }),
        });

        const count = data?.createdCount ?? ids.length;
        setStatus(`✅ Aanvraag verstuurd naar ${count} bedrijf(ven).`, false);

        sendBtn.disabled = true;
        sendBtn.classList.add("opacity-60");
      } catch (err) {
        console.error("❌ Versturen mislukt:", err);
        setStatus(err?.message || "Versturen mislukt", true);
      }
    });
  }
}

function updateSelectionUI() {
  const countEl = document.getElementById("selectedCount");
  const namesEl = document.getElementById("selectedNames");

  const ids = Array.from(selectedIds);
  if (countEl) countEl.textContent = `${ids.length} geselecteerd`;

  if (namesEl) {
    const nameMap = new Map((companies || []).map((c) => [String(c._id), c.name]));
    const names = ids.map((id) => nameMap.get(String(id)) || id).slice(0, 5);
    namesEl.textContent = names.join(" • ");
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
