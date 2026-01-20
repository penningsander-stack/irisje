// frontend/js/results.js
// Resultatenpagina – stabiele selectie + profiel in modal + doorsturen naar request-send

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

  const stateEl = document.getElementById("resultsState");
  const listEl = document.getElementById("companiesList");
  const footerEl = document.getElementById("resultsFooter");
  const countEl = document.getElementById("selectedCount");
  const sendBtn = document.getElementById("sendBtn");
  const subtitleEl = document.getElementById("resultsSubtitle");
  const stickySubmitBtn = document.getElementById("stickySubmitBtn");

  const modalOverlay = document.getElementById("companyModalOverlay");
  const modalCloseBtn = document.getElementById("companyModalClose");
  const modalOpenNewTabBtn = document.getElementById("companyModalOpenNewTab");
  const modalTitle = document.getElementById("companyModalTitle");
  const modalFrame = document.getElementById("companyModalFrame");

  let modalUrl = "";

  if (!stateEl || !listEl) return;

  if (!requestId) {
    stateEl.textContent = "Ongeldige aanvraag.";
    return;
  }

  function openCompanyModal(url, titleText) {
    modalUrl = url;
    modalTitle.textContent = titleText || "Bedrijfsprofiel";
    modalFrame.src = url;
    modalOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function closeCompanyModal() {
    modalOverlay.style.display = "none";
    modalFrame.src = "about:blank";
    modalUrl = "";
    document.body.style.overflow = "";
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeCompanyModal);
  if (modalOverlay)
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeCompanyModal();
    });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCompanyModal();
  });

  if (modalOpenNewTabBtn) {
    modalOpenNewTabBtn.addEventListener("click", () => {
      if (modalUrl) window.open(modalUrl, "_blank", "noopener");
    });
  }

  function handleSendClick() {
    const selected = document.querySelectorAll(".company-checkbox:checked");
    if (!selected.length) return alert("Selecteer minimaal één bedrijf.");

    if (selected.length > 5)
      return alert("Je kunt maximaal 5 bedrijven selecteren.");

    const ids = Array.from(selected)
      .map((cb) => cb.dataset.companyId)
      .filter(Boolean);

    sessionStorage.setItem("selectedCompanyIds", JSON.stringify(ids));
    sessionStorage.setItem("requestId", requestId);

    window.location.href = `/request-send.html?requestId=${encodeURIComponent(
      requestId
    )}`;
  }

  if (sendBtn) sendBtn.addEventListener("click", handleSendClick);
  if (stickySubmitBtn)
    stickySubmitBtn.addEventListener("click", handleSendClick);

  try {
    const res = await fetch(
      `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(res.status);

    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const request = data.request || {};

    const notice = document.getElementById("noLocalNotice");
    if (data.noLocalResults) {
      notice.textContent = `Geen ${request.sector.toLowerCase()} in ${
        request.city
      }. Hieronder tonen we ${request.sector.toLowerCase()} uit andere plaatsen.`;
      notice.classList.remove("hidden");
    } else {
      notice.classList.add("hidden");
    }

    if (subtitleEl) {
      subtitleEl.textContent = `Gebaseerd op jouw aanvraag voor ${
        request.sector || ""
      } in ${request.city || ""}.`;
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



/**
 * SORTERING & "BESTE MATCH" – BELANGRIJK
 *
 * De badge "Beste match" wordt toegekend aan het EERSTE bedrijf
 * in de gesorteerde resultatenlijst (index === 0).
 *
 * De sortering wordt al VÓÓR deze functie bepaald.
 * Deze functie GAAT UIT van correcte volgorde en wijzigt die NIET.
 *
 * Verwachte sorteervolgorde (NIET wijzigen zonder expliciet akkoord):
 *
 * 1. Plaatsmatch
 *    - Bedrijven in exact dezelfde plaats als de aanvraag eerst.
 *    - Alleen als er 0 lokale resultaten zijn, wordt fallback gebruikt.
 *
 * 2. Reviews aanwezig
 *    - Bedrijven met reviews boven bedrijven zonder reviews.
 *    - Geldt voor Google- en Irisje-reviews.
 *
 * 3. Gemiddelde rating (aflopend)
 *    - Eerst Irisje averageRating (indien aanwezig),
 *      anders Google avgRating.
 *    - Ruwe numerieke waarde telt (geen afronding).
 *
 * 4. Aantal reviews (aflopend)
 *
 * 5. Verificatiestatus
 *    - isVerified = true boven false.
 *
 * 6. Stabiele fallback
 *    - Alphabetisch op bedrijfsnaam (A–Z).
 *
 * ⚠️ Let op:
 * - Deze functie gebruikt index === 0 voor "Beste match".
 * - Wijzigingen hier kunnen direct UI- en rankinggedrag breken.
 */






  function renderCompanies(companies) {
    listEl.innerHTML = "";
    updateSelectionUI();

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const profileUrl = `/company.html?slug=${encodeURIComponent(company.slug || "")}&embed=1`;


      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox"
            class="company-checkbox"
            data-company-id="${company._id || ""}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3 class="company-name block">
  ${index === 0 ? `<span class="best-match-badge">Beste match</span>` : ""}
  <a href="${profileUrl}"
     class="company-profile-link"
     data-profile-url="${profileUrl}"
     data-company-name="${escapeHtml(company.name)}">
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

    listEl.addEventListener("click", (e) => {
      const link = e.target.closest(".company-profile-link");
      if (!link) return;
      e.preventDefault();
      openCompanyModal(
        link.dataset.profileUrl,
        link.dataset.companyName
      );
    });
  }

  function updateSelectionUI() {
    const selected = document.querySelectorAll(".company-checkbox:checked").length;
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
