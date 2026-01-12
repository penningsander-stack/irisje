// frontend/js/results.js
// G1: hard max-selectie (totaal 5, max 4 extra bij startbedrijf)

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const grid = document.getElementById("resultsGrid");
  const emptyState = document.getElementById("emptyState");
  const intro = document.getElementById("resultsIntro");
  const selectedCountEl = document.getElementById("selectedCount");
  const submitBtn = document.getElementById("submitBtn");
  const fixedBox = document.getElementById("fixedCompanyBox");
  const fixedNameEl = document.getElementById("fixedCompanyName");

  let requestId = null;
  let fixedCompanyId = null; // string
  const selected = new Set(); // companyId strings
  const checkboxById = new Map(); // companyId -> checkbox

  document.addEventListener("DOMContentLoaded", init);

  function maxTotal() { return 5; }
  function maxExtra() { return fixedCompanyId ? 4 : 5; }

  async function init() {
    const params = new URLSearchParams(location.search);
    requestId = params.get("requestId");
    if (!requestId) return showEmpty("Deze pagina kun je alleen bereiken via een offerteaanvraag.");

    try {
      // aanvraag ophalen
      const reqRes = await fetch(`${API_BASE}/publicrequests/${encodeURIComponent(requestId)}`);
      const reqData = await reqRes.json();
      if (!reqRes.ok || !reqData?.ok || !reqData.request) {
        return showEmpty("Geen aanvraag gevonden.");
      }

      const req = reqData.request;
      const requestCategory = (req.category || "").trim() || null;
      const requestCompanySlug = (req.companySlug || "").trim() || null;

      // startbedrijf (via slug)
      if (requestCompanySlug) {
        try {
          const cRes = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(requestCompanySlug)}`);
          const cData = await cRes.json();
          if (cRes.ok && cData?.ok && cData.company) {
            fixedCompanyId = String(cData.company._id || cData.company.id || "");
            if (fixedCompanyId) {
              selected.add(fixedCompanyId);
              fixedBox.classList.remove("hidden");
              fixedNameEl.textContent = cData.company.name || "Geselecteerd bedrijf";
              updateSelectedCount();
            }
          }
        } catch (e) {
          console.error("startbedrijf fetch error:", e);
        }
      }

      // overige bedrijven
      const companiesRes = await fetch(`${API_BASE}/companies`);
      const companiesData = await companiesRes.json();
      let companies = Array.isArray(companiesData?.results)
        ? companiesData.results
        : Array.isArray(companiesData?.companies)
        ? companiesData.companies
        : [];

      // startbedrijf uitsluiten
      if (fixedCompanyId) {
        companies = companies.filter(c => String(c._id || c.id || "") !== fixedCompanyId);
      }

      // filter categorie
      if (requestCategory) {
        companies = companies.filter(
          c => Array.isArray(c.categories) && c.categories.includes(requestCategory)
        );
      }

      intro.textContent = fixedCompanyId
        ? "Je aanvraag is aangemaakt. Je kunt deze ook naar maximaal 4 andere geschikte bedrijven sturen."
        : "Je aanvraag is aangemaakt. Kies maximaal 5 bedrijven om je aanvraag naartoe te sturen.";

      render(companies);
      updateSelectedCount();
      updateDisabling();
    } catch (e) {
      console.error("results init error:", e);
      showEmpty("Kon resultaten niet laden.");
    }
  }

  function render(companies) {
    grid.innerHTML = "";
    checkboxById.clear();

    for (const c of companies) {
      const id = String(c._id || c.id || "");
      if (!id) continue;

      const card = document.createElement("div");
      card.className = "border rounded-xl p-4 bg-white flex items-start gap-3";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = selected.has(id);

      cb.addEventListener("change", () => {
        // HARD GUARDS
        if (cb.checked) {
          if (selected.size >= maxTotal()) { cb.checked = false; return; }
          if (fixedCompanyId && countExtra() >= maxExtra()) { cb.checked = false; return; }
          selected.add(id);
        } else {
          selected.delete(id);
        }
        updateSelectedCount();
        updateDisabling();
      });

      checkboxById.set(id, cb);

      const info = document.createElement("div");
      info.innerHTML = `
        <div class="font-semibold">${esc(c.name || "")}</div>
        <div class="text-sm text-gray-600">${esc(c.city || "")}</div>
        <div class="text-sm">${esc((c.categories || []).join(", "))}</div>
      `;

      card.appendChild(cb);
      card.appendChild(info);
      grid.appendChild(card);
    }
  }

  function countExtra() {
    if (!fixedCompanyId) return selected.size;
    let n = 0;
    for (const id of selected) if (id !== fixedCompanyId) n++;
    return n;
  }

  function updateSelectedCount() {
    selectedCountEl.textContent = String(selected.size);
    if (selected.size > 0) {
      submitBtn.classList.remove("opacity-50", "pointer-events-none");
    } else {
      submitBtn.classList.add("opacity-50", "pointer-events-none");
    }
  }

  function updateDisabling() {
    const totalLimit = selected.size >= maxTotal();
    const extraLimit = fixedCompanyId && countExtra() >= maxExtra();

    for (const [id, cb] of checkboxById.entries()) {
      if (cb.checked) { cb.disabled = false; continue; }
      if (totalLimit) { cb.disabled = true; continue; }
      if (extraLimit) { cb.disabled = true; continue; }
      cb.disabled = false;
    }
  }

  submitBtn.addEventListener("click", async () => {
    if (!requestId || selected.size === 0) return;

    try {
      const res = await fetch(`${API_BASE}/publicrequests/${encodeURIComponent(requestId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.message || "Versturen mislukt.");
        return;
      }
      alert(`Aanvraag verstuurd naar ${data.created} bedrijven.`);
    } catch (e) {
      console.error("submit error:", e);
      alert("Versturen mislukt.");
    }
  });

  function showEmpty(msg) {
    grid.innerHTML = "";
    emptyState.classList.remove("hidden");
    const p = emptyState.querySelector("p");
    if (p) p.textContent = msg;
  }

  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }
})();
