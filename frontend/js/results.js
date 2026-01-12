// frontend/js/results.js
// Trustoo-flow: startbedrijf = 1, nooit dubbel, teller altijd correct

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
      if (!reqRes.ok || !reqData.ok || !reqData.request) {
        throw new Error("Aanvraag niet gevonden");
      }

      const request = reqData.request;
      const requestCategory = request.category || null;
      const requestCompanySlug = request.companySlug || null;

      // 2️⃣ startbedrijf EXPLICIET ophalen via slug
      let fixedCompany = null;

      if (requestCompanySlug) {
        const cRes = await fetch(`${API_BASE}/companies/slug/${requestCompanySlug}`);
        const cData = await cRes.json();
        if (cRes.ok && cData.ok && cData.company) {
          fixedCompany = cData.company;
        }
      }

      if (fixedCompany) {
        fixedCompanyId = String(fixedCompany._id);
        selected.add(fixedCompanyId);

        fixedBox.classList.remove("hidden");
        fixedNameEl.textContent = fixedCompany.name;

        // 🔒 TELLER EXPLICIET OP 1
        selectedCountEl.textContent = "1";
        submitBtn.classList.remove("opacity-50", "pointer-events-none");
      }

      // 3️⃣ overige bedrijven ophalen
      const res = await fetch(`${API_BASE}/companies`);
      const data = await res.json();

      let companies = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.companies)
        ? data.companies
        : [];

      // verwijder startbedrijf
      if (fixedCompanyId) {
        companies = companies.filter(c => String(c._id) !== fixedCompanyId);
      }

      // filter op categorie
      if (requestCategory) {
        companies = companies.filter(
          c => Array.isArray(c.categories) && c.categories.includes(requestCategory)
        );
      }

      intro.textContent =
        "Je aanvraag is aangemaakt. Je kunt deze ook naar andere geschikte bedrijven sturen.";

      renderCompanies(companies);
    } catch (err) {
      console.error(err);
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
        <div class="font-semibold">${escapeHtml(c.name)}</div>
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
    submitBtn.classList.toggle("opacity-50", selected.size === 0);
    submitBtn.classList.toggle("pointer-events-none", selected.size === 0);
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
