// frontend/js/results.js
// v2026-01-13 — DOM-safe + filter fallback

(() => {
  const API = "https://irisje-backend.onrender.com/api/publicRequests";

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return;

  // SAFE DOM LOOKUPS
  const listEl = document.getElementById("companyList");
  const countEl = document.getElementById("selectedCount") 
               || document.getElementById("selectedCounter");
  const hintEl = document.getElementById("filterHint");
  const emptyEl = document.getElementById("emptyState");
  const cityInput = document.getElementById("cityFilter");
  const filterBtn = document.getElementById("applyFilterBtn");
  const sendBtn = document.getElementById("sendRequestBtn");

  let allCompanies = [];
  let visibleCompanies = [];
  const selectedIds = new Set();

  fetch(`${API}/${requestId}`)
    .then(r => r.json())
    .then(data => {
      allCompanies = Array.isArray(data.companies) ? data.companies : [];
      visibleCompanies = [...allCompanies];
      render();
    })
    .catch(() => {
      if (emptyEl) {
        emptyEl.textContent = "Kon bedrijven niet laden.";
        emptyEl.classList.remove("hidden");
      }
    });

  const norm = v => (v || "").toString().toLowerCase();

  function applyCityFilter() {
    if (!cityInput) return;

    const q = norm(cityInput.value);
    if (hintEl) hintEl.classList.add("hidden");

    if (!q) {
      visibleCompanies = [...allCompanies];
      render();
      return;
    }

    const matched = allCompanies.filter(c =>
      norm(c.city).includes(q) ||
      norm(c.place).includes(q) ||
      norm(c.location).includes(q)
    );

    if (matched.length === 0) {
      visibleCompanies = [...allCompanies];
      if (hintEl) {
        hintEl.textContent =
          "Geen exacte match op plaats. We tonen alle beschikbare bedrijven.";
        hintEl.classList.remove("hidden");
      }
    } else {
      visibleCompanies = matched;
    }

    render();
  }

  filterBtn?.addEventListener("click", applyCityFilter);

  function render() {
    if (!listEl) return;

    listEl.innerHTML = "";
    emptyEl?.classList.add("hidden");

    if (visibleCompanies.length === 0) {
      if (emptyEl) {
        emptyEl.textContent = "Geen bedrijven beschikbaar voor deze aanvraag.";
        emptyEl.classList.remove("hidden");
      }
      updateCount();
      return;
    }

    visibleCompanies.forEach(company => {
      const card = document.createElement("div");
      card.className = "company-card";

      const checked = selectedIds.has(company._id);

      card.innerHTML = `
        <label class="company-row">
          <input type="checkbox" ${checked ? "checked" : ""}>
          <div class="company-info">
            <strong>${company.name}</strong>
            ${company.city ? `<div class="muted">${company.city}</div>` : ""}
          </div>
        </label>
      `;

      const checkbox = card.querySelector("input");
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          if (selectedIds.size >= 5) {
            checkbox.checked = false;
            return;
          }
          selectedIds.add(company._id);
        } else {
          selectedIds.delete(company._id);
        }
        updateCount();
      });

      listEl.appendChild(card);
    });

    updateCount();
  }

  function updateCount() {
    if (countEl) {
      countEl.textContent = `${selectedIds.size} van 5 geselecteerd`;
    }
    if (sendBtn) {
      sendBtn.disabled = selectedIds.size === 0;
    }
  }

  sendBtn?.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;

    sendBtn.disabled = true;
    sendBtn.textContent = "Bezig…";

    try {
      const res = await fetch(`${API}/${requestId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyIds: Array.from(selectedIds),
          city: cityInput?.value || ""
        })
      });

      if (!res.ok) throw new Error();

      window.location.href = `/success.html?requestId=${requestId}`;
    } catch {
      sendBtn.disabled = false;
      sendBtn.textContent = "Aanvraag versturen";
      alert("Verzenden mislukt. Probeer opnieuw.");
    }
  });
})();
