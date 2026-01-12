// frontend/js/results.js
// End-to-end fix: startbedrijf vast (teller=1), nooit dubbel, max 4 extra selecteerbaar

(function () {
  const API_BASE = "https://irisje-backend.onrender.com/api";

  const grid = document.getElementById("resultsGrid");
  const emptyState = document.getElementById("emptyState");
  const intro = document.getElementById("resultsIntro");
  const selectedCountEl = document.getElementById("selectedCount");
  const submitBtn = document.getElementById("submitBtn");
  const fixedBox = document.getElementById("fixedCompanyBox");
  const fixedNameEl = document.getElementById("fixedCompanyName");

  // state
  let requestId = null;
  let fixedCompanyId = null; // string
  const selected = new Set(); // companyId strings
  const checkboxById = new Map(); // companyId -> checkbox element

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    const params = new URLSearchParams(location.search);
    requestId = params.get("requestId");

    if (!requestId) {
      return showEmpty("Deze pagina kun je alleen bereiken via een offerteaanvraag.");
    }

    try {
      // 1) aanvraag ophalen
      const reqRes = await fetch(`${API_BASE}/publicrequests/${encodeURIComponent(requestId)}`);
      const reqData = await reqRes.json();

      if (!reqRes.ok || !reqData || !reqData.ok || !reqData.request) {
        return showEmpty("Geen aanvraag gevonden.");
      }

      const req = reqData.request;
      const requestCategory = (req.category || "").trim() || null;
      const requestCompanySlug = (req.companySlug || "").trim() || null;

      // 2) startbedrijf ophalen via slug (betrouwbaar)
      if (requestCompanySlug) {
        try {
          const cRes = await fetch(`${API_BASE}/companies/slug/${encodeURIComponent(requestCompanySlug)}`);
          const cData = await cRes.json();
          if (cRes.ok && cData && cData.ok && cData.company) {
            fixedCompanyId = String(cData.company._id || cData.company.id || "");
            if (fixedCompanyId) {
              selected.add(fixedCompanyId);

              fixedBox.classList.remove("hidden");
              fixedNameEl.textContent = cData.company.name || "Geselecteerd bedrijf";

              // ✅ teller direct naar 1
              updateSelectedCount();
            }
          }
        } catch (e) {
          console.error("startbedrijf fetch error:", e);
        }
      }

      // 3) overige bedrijven ophalen
      const companiesRes = await fetch(`${API_BASE}/companies`);
      const companiesData = await companiesRes.json();

      let companies = Array.isArray(companiesData?.results)
        ? companiesData.results
        : Array.isArray(companiesData?.companies)
        ? companiesData.companies
        : [];

      // 4) startbedrijf uitsluiten uit extra lijst (nooit dubbel)
      if (fixedCompanyId) {
        companies = companies.filter((c) => String(c._id || c.id || "") !== fixedCompanyId);
      }

      // 5) filter op categorie voor extra bedrijven
      if (requestCategory) {
        companies = companies.filter(
          (c) => Array.isArray(c.categories) && c.categories.includes(requestCategory)
        );
      }

      intro.textContent =
        fixedCompanyId
          ? "Je aanvraag is aangemaakt. Je kunt deze ook naar maximaal 4 andere geschikte bedrijven sturen."
          : "Je aanvraag is aangemaakt. Kies maximaal 5 bedrijven om je aanvraag naartoe te sturen.";

      renderCompanies(companies);
      updateSelectedCount();
      updateCheckboxDisabling();
    } catch (e) {
      console.error("results init error:", e);
      showEmpty("Kon resultaten niet laden.");
    }
  }

  function maxTotalSelectable() {
    // Startbedrijf telt mee als 1 → max 4 extra → totaal 5
    return 5;
  }

  function maxExtraSelectable() {
    // Als startbedrijf bestaat: 4 extra, anders 5 (want dan is er geen vaste)
    return fixedCompanyId ? 4 : 5;
  }

  function renderCompanies(companies) {
    grid.innerHTML = "";
    checkboxById.clear();

    for (const c of companies) {
      const id = String(c._id || c.id || "");
      if (!id) continue;

      const card = document.createElement("div");
      card.className = "border rounded-xl p-4 bg-white flex items-start gap-3";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = selected.has(id);

      checkbox.addEventListener("change", () => {
        const isChecked = checkbox.checked;

        if (isChecked) {
          // limiet: totaal 5 (incl. startbedrijf)
          if (selected.size >= maxTotalSelectable()) {
            checkbox.checked = false;
            return;
          }

          // extra-limiet: max 4 extra als startbedrijf bestaat
          if (fixedCompanyId) {
            const extraCount = countExtraSelected();
            if (extraCount >= maxExtraSelectable()) {
              checkbox.checked = false;
              return;
            }
          }

          selected.add(id);
        } else {
          selected.delete(id);
        }

        updateSelectedCount();
        updateCheckboxDisabling();
      });

      checkboxById.set(id, checkbox);

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

  function countExtraSelected() {
    if (!fixedCompanyId) return selected.size;
    let extra = 0;
    for (const id of selected) {
      if (id !== fixedCompanyId) extra++;
    }
    return extra;
  }

  function updateSelectedCount() {
    selectedCountEl.textContent = String(selected.size);

    if (selected.size > 0) {
      submitBtn.classList.remove("opacity-50", "pointer-events-none");
    } else {
      submitBtn.classList.add("opacity-50", "pointer-events-none");
    }
  }

  function updateCheckboxDisabling() {
    const totalLimitReached = selected.size >= maxTotalSelectable();

    // als startbedrijf bestaat: extra-limit reached zodra extra==4
    const extraLimitReached = fixedCompanyId ? countExtraSelected() >= maxExtraSelectable() : selected.size >= maxExtraSelectable();

    for (const [id, checkbox] of checkboxById.entries()) {
      if (checkbox.checked) {
        checkbox.disabled = false;
        continue;
      }

      // Niet-aangevinkte checkboxes uitzetten zodra limiet is bereikt
      if (totalLimitReached) {
        checkbox.disabled = true;
        continue;
      }

      if (fixedCompanyId && extraLimitReached) {
        checkbox.disabled = true;
        continue;
      }

      checkbox.disabled = false;
    }
  }

  submitBtn.addEventListener("click", async () => {
    if (!requestId) return;
    if (selected.size === 0) return;

    try {
      const res = await fetch(`${API_BASE}/publicrequests/${encodeURIComponent(requestId)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyIds: Array.from(selected) }),
      });

      const data = await res.json();
      if (!res.ok || !data || !data.ok) {
        alert((data && data.message) || "Versturen mislukt.");
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
