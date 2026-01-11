// frontend/js/results.js
// v2026-01-17 — Stap P1.2 (scope-safe)

(function () {
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
    const params = new URLSearchParams(window.location.search);
    requestId = params.get("requestId");

    if (!requestId) {
      showEmpty("Geen aanvraag gevonden.");
      return;
    }

    try {
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

      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();

      const companies = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.companies)
        ? data.companies
        : [];

      if (!companies.length) {
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

    companies.forEach((c) => {
      const id = String(c._id || c.id);
      const isFixed = id === fixedCompanyId;

      const card = document.createElement("div");
      card.className =
        "border rounded-xl p-4 bg-white shadow-soft flex items-start gap-3";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
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
        <div class="font-semibold">${escapeHtml(c.name || "")}</div>
        <div class="text-sm text-slate-600">${escapeHtml(c.city || "")}</div>
      `;

      card.appendChild(checkbox);
      card.appendChild(info);
      grid.appendChild(card);
    });
  }

  function updateSelectedCount() {
    selectedCountEl.textContent = selected.size;

    submitBtn.classList.toggle(
      "pointer-events-none",
      selected.size === 0
    );
    submitBtn.classList.toggle(
      "opacity-50",
      selected.size === 0
    );
  }

  submitBtn.addEventListener("click", async () => {
    if (!selected.size) return;

    try {
      const res = await fetch(
        `${API_BASE}/publicRequests/${requestId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyIds: Array.from(selected) }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert("Versturen mislukt.");
        return;
      }

      alert(`Aanvraag verstuurd naar ${data.created} bedrijven.`);
    } catch (e) {
      console.error(e);
      alert("Versturen mislukt.");
    }
  });

  function showEmpty(msg) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.querySelector("p").textContent = msg;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
