// frontend/js/results.js
// Resultatenpagina – request-mode + A17 company-mode
// ⭐ Google & Irisje sterren ongewijzigd

/* =========================
   ⭐ Google-style sterren
   ========================= */

function renderStars(rating) {
  if (typeof rating !== "number" || rating <= 0) return "";

  const rounded = Math.round(rating * 2) / 2;

  let html = `
    <span class="rating-number mr-1 text-gray-900">
      ${rounded.toString().replace(".", ",")}
    </span>
    <span class="star-rating">
  `;

  for (let i = 1; i <= 5; i++) {
    let fill = 0;
    if (rounded >= i) fill = 100;
    else if (rounded + 0.5 === i) fill = 50;

    html += `
      <span class="star">
        ★
        <span class="star-fill" style="width:${fill}%">★</span>
      </span>
    `;
  }

  html += `</span>`;
  return html;
}

function renderReviewBlock(company) {
  const googleRating =
    typeof company.avgRating === "number" ? company.avgRating : null;

  const irisjeRating =
    typeof company.averageRating === "number" ? company.averageRating : null;

  const irisjeCount =
    Number.isInteger(company.reviewCount) ? company.reviewCount : 0;

  let html = `<div class="company-reviews mt-1 flex flex-col gap-0.5 text-sm">`;

  if (googleRating) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Google</span>
        <span class="text-yellow-500">${renderStars(googleRating)}</span>
      </div>
    `;
  }

  if (irisjeRating && irisjeCount > 0) {
    html += `
      <div class="flex items-center gap-1">
        <span class="text-gray-500 text-xs">Irisje</span>
        <span class="text-yellow-500">${renderStars(irisjeRating)}</span>
        <span class="text-gray-400 text-xs">(${irisjeCount})</span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/* =========================
   DOMContentLoaded
   ========================= */

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);

  const requestId = params.get("requestId");
  const companySlug = params.get("company"); // ✅ A17

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");

  if (!stateEl || !listEl) return;

  const isRequestMode = !!requestId;
  const isCompanyMode = !!companySlug;

  if (!isRequestMode && !isCompanyMode) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  /* =========================
     ✔ Max 5 selectie
     ========================= */

  listEl.addEventListener("change", (e) => {
    const cb = e.target.closest(".company-checkbox");
    if (!cb) return;

    const checkedCount = listEl.querySelectorAll(
      ".company-checkbox:checked"
    ).length;

    if (checkedCount > 5) {
      cb.checked = false;
      alert("Je kunt maximaal 5 bedrijven selecteren.");
    }

    updateSelectionUI();
  });

  /* =========================
     Verzenden
     ========================= */

  function handleSendClick() {
    const selected = document.querySelectorAll(".company-checkbox:checked");
    if (!selected.length) return alert("Selecteer minimaal één bedrijf.");
    if (selected.length > 5)
      return alert("Je kunt maximaal 5 bedrijven selecteren.");

    const selectedCompanies = Array.from(selected).map((cb) => ({
      id: cb.dataset.companyId,
      slug: cb.dataset.companySlug
    }));

    sessionStorage.setItem(
      "selectedCompanyIds",
      JSON.stringify(selectedCompanies.map((c) => c.id))
    );

    if (requestId) {
      window.location.href = `/request-send.html?requestId=${encodeURIComponent(
        requestId
      )}`;
    } else {
      window.location.href = `/request-send.html?company=${encodeURIComponent(
        companySlug
      )}`;
    }
  }

  if (sendBtn) sendBtn.addEventListener("click", handleSendClick);

  /* =========================
     Data ophalen
     ========================= */

  try {
    let fetchUrl;
    let companies = [];

    if (isRequestMode) {
      fetchUrl = `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`;
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      companies = Array.isArray(data.companies) ? data.companies : [];
    }

    if (isCompanyMode) {
      fetchUrl = `https://irisje-backend.onrender.com/api/public/companyContext/${companySlug}`;
      const res = await fetch(fetchUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      companies = Array.isArray(data.matches) ? data.matches : [];
    }

    if (!companies.length) {
      stateEl.textContent =
        "Er zijn op dit moment geen bedrijven beschikbaar.";
      return;
    }

    stateEl.textContent = "";
    renderCompanies(companies);

    if (footerEl) footerEl.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";
    updateSelectionUI();

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const profileUrl = `/company.html?slug=${encodeURIComponent(
        company.slug || ""
      )}&embed=1`;

      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox"
            class="company-checkbox"
            data-company-id="${company._id || company.id || ""}"
            data-company-slug="${company.slug || ""}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3 class="company-name block">
                ${
                  index === 0
                    ? `<span class="best-match-badge">Beste match</span>`
                    : ""
                }
                <a href="${profileUrl}" class="company-profile-link">
                  ${escapeHtml(company.name)}
                </a>
              </h3>
              ${renderReviewBlock(company)}
            </div>
            <div class="company-city">${escapeHtml(company.city)}</div>
          </div>
        </label>
      `;

      listEl.appendChild(card);
    });
  }

  function updateSelectionUI() {
    const selected = listEl.querySelectorAll(
      ".company-checkbox:checked"
    ).length;
    if (countEl) countEl.textContent = `${selected} van 5 geselecteerd`;
    if (sendBtn) sendBtn.disabled = selected === 0;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (s) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[s]);
  }
});
