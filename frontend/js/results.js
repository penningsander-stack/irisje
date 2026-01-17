// frontend/js/results.js
// Resultatenpagina – selectie + modal – visuele polish plaatsweergave (Stap 1C)

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

  // Modal
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
    if (!modalOverlay || !modalFrame || !modalTitle) return;
    modalUrl = url;
    modalTitle.textContent = titleText || "Bedrijfsprofiel";
    modalFrame.src = url;
    modalOverlay.style.display = "block";
    document.body.style.overflow = "hidden";
  }
  function closeCompanyModal() {
    if (!modalOverlay || !modalFrame) return;
    modalOverlay.style.display = "none";
    modalFrame.src = "about:blank";
    modalUrl = "";
    document.body.style.overflow = "";
  }
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeCompanyModal);
  if (modalOverlay) modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeCompanyModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCompanyModal(); });
  if (modalOpenNewTabBtn) modalOpenNewTabBtn.addEventListener("click", () => modalUrl && window.open(modalUrl, "_blank", "noopener"));

  function handleSendClick() {
    const checked = document.querySelectorAll(".company-checkbox:checked");
    if (!checked.length) return alert("Selecteer minimaal één bedrijf.");

    const selectedCompanies = Array.from(checked).map(cb => ({
      id: cb.dataset.companyId || "",
      name: cb.dataset.companyName || "",
      city: cb.dataset.companyCity || "",
      slug: cb.dataset.companySlug || ""
    })).filter(c => c.id);

    const companyIds = selectedCompanies.map(c => c.id);
    if (!companyIds.length) return alert("Selectie is ongeldig.");

    sessionStorage.setItem("selectedCompanyIds", JSON.stringify(companyIds));
    sessionStorage.setItem("selectedCompanies", JSON.stringify(selectedCompanies));
    sessionStorage.setItem("requestId", String(requestId));
    window.location.href = `/request-send.html?requestId=${encodeURIComponent(requestId)}`;
  }
  if (sendBtn) sendBtn.addEventListener("click", handleSendClick);
  if (stickySubmitBtn) stickySubmitBtn.addEventListener("click", handleSendClick);

  try {
    const res = await fetch(`https://irisje-backend.onrender.com/api/publicRequests/${requestId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const request = data.request || {};

    if (subtitleEl) subtitleEl.textContent = `Gebaseerd op jouw aanvraag voor ${request.sector || ""} in ${request.city || ""}.`;

    if (!companies.length) {
      stateEl.textContent = "Er zijn op dit moment geen bedrijven beschikbaar voor deze aanvraag.";
      return;
    }
    stateEl.textContent = "";
    renderCompanies(companies);
    if (footerEl) footerEl.classList.remove("hidden");
  } catch {
    stateEl.textContent = "Resultaten konden niet worden geladen.";
  }

  function renderCompanies(companies) {
    listEl.innerHTML = "";
    updateSelectionUI();

    companies.forEach((company, index) => {
      const card = document.createElement("div");
      card.className = "result-card";

      const companyId = String(company?._id || "");
      const name = escapeHtml(company?.name);
      const city = escapeHtml(company?.city);
      const rawSlug = company?.slug ? String(company.slug) : "";
      const slug = encodeURIComponent(rawSlug);
      const profileUrl = `/company.html?slug=${slug}`;
      const badge = index < 5 ? `<span class="top-match-badge">Beste match</span>` : "";

      card.innerHTML = `
        <label class="company-select">
          <input type="checkbox" class="company-checkbox"
            data-company-id="${companyId}"
            data-company-name="${name}"
            data-company-city="${city}"
            data-company-slug="${escapeHtml(rawSlug)}"
          />
          <div class="company-info">
            <div class="company-header">
              <h3>
                <a href="${profileUrl}" class="company-profile-link"
                   data-profile-url="${profileUrl}" data-company-name="${name}">
                  ${name}
                </a>
              </h3>
              ${badge}
            </div>

            <!-- Verbeterde plaatsweergave -->
            <div class="company-city"
                 style="
                   margin-top:6px;
                   font-size:14px;
                   line-height:1.35;
                   color:#555;
                   font-weight:500;
                 ">
              ${city}
            </div>
          </div>
        </label>
      `;

      const checkbox = card.querySelector(".company-checkbox");
      checkbox.addEventListener("change", () => {
        if (document.querySelectorAll(".company-checkbox:checked").length > 5) checkbox.checked = false;
        updateSelectionUI();
      });

      listEl.appendChild(card);
    });

    listEl.addEventListener("click", e => {
      const link = e.target.closest(".company-profile-link");
      if (!link) return;
      e.preventDefault();
      openCompanyModal(link.dataset.profileUrl, link.dataset.companyName);
    });
  }

  function updateSelectionUI() {
    const selected = document.querySelectorAll(".company-checkbox:checked").length;
    if (countEl) countEl.textContent = `${selected} van 5 geselecteerd`;
    if (sendBtn) sendBtn.disabled = selected === 0;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[s]));
  }
});
