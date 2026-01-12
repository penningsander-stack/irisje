// frontend/js/results.js
// Trustoo-model: startbedrijf vast + max. 4 extra bedrijven
// FIX: teller = 1 en startbedrijf niet dubbel tonen

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const grid = document.getElementById("resultsGrid");
  const emptyState = document.getElementById("emptyState");
  const intro = document.getElementById("resultsIntro");
  const selectedCountEl = document.getElementById("selectedCount");
  const submitBtn = document.getElementById("submitBtn");
  const fixedBox = document.getElementById("fixedCompanyBox");
  const fixedNameEl = document.getElementById("fixedCompanyName");

  let selected = new Set();
  let fixedCompanyId = null;
  let requestId = null;
  let requestCategory = null;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const params = new URLSearchParams(location.search);
    requestId = params.get("requestId");
    if (!requestId) {
      return showEmpty("Deze pagina kun je alleen bereiken via een offerteaanvraag.");
    }

    try {
      // 1️⃣ aanvraag ophalen
      const reqRes = await fetch(`${API_BASE}/publicRequests/${requestId}`);
      const reqData = await reqRes.json();
      if (!reqRes.ok || !reqData.ok || !reqData.request) throw new Error();

      const req = reqData.request;
      requestCategory = req.category || null;

      // 2️⃣ startbedrijf bepalen
      if (req.companyId) {
        fixedCompanyId = String(req.companyId);
        selected.add(fixedCompanyId);
        fixedBox.classList.remove("hidden");
        fixedNameEl.textContent = req.companyName || "Geselecteerd bedrijf";
      } else if (req.companySlug) {
        const cRes = await fetch(`${API_BASE}/companies/slug/${req.companySlug}`);
        const cData = await cRes.json();
        if (cRes.ok && cData.ok && cData.company) {
          fixedCompanyId = String(cData.company._id);
          selected.add(fixedCompanyId);
          fixedBox.classList.remove("hidden");
          fixedNameEl.textContent = cData.company.name;
        }
      }

      // 3️⃣ bedrijven laden
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();
      let companies = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.companies)
        ? data.companies
        : [];

      // filter op categorie
      if (requestCategory) {
        companies = companies.filter(
          c => Array.isArray(c.categories) && c.categories.includes(requestCategory)
        );
      }

      // 🔥 VERWIJDER startbedrijf uit lijst
      if (fixedCompanyId) {
        companies = companies.filter(
          c => String(c._id) !== fixedCompanyId
        );
      }

      if (companies.length === 0) {
        intro.textContent =
          "Je aanvraag is aangemaakt. Er zijn geen extra geschikte bedrijven gevonden.";
      } else {
        intro.textContent =
          "Je aanvraag is aangemaakt. Je kunt deze ook naar andere geschikte bedrijven sturen.";
      }

      renderCompanies(companies);

      // 🔥 Dwing teller NA render
      updateSelectedCount();
    } catch (e) {
      console.error(e);
      showEmpty("Kon resultaten niet laden.");
    }
  }

  function renderCompanies(companies) {
    grid.innerHTML = "";

    for (const c of companies) {
      const id = String(c._id);

      const card = document.createElement("div");
      card.className = "border rounded-xl p-4 bg-white flex items-start gap-3";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";

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
        <div class="text-sm text-gray-600">${escapeHtml(c.city || "")}</div>
        <div class="text-sm">${escapeHtml((c.categories || []).join(", "))}</div>
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
      const res = await fetch(
        `${API_BASE}/publicRequests/${requestId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyIds: Array.from(selected) })
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
})();
