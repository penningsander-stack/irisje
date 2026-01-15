function renderCompanies(companies) {
  listEl.innerHTML = "";
  let selected = 0;

  companies.forEach((company, index) => {
    const card = document.createElement("div");
    card.className = "result-card";

    // ⬇️ NIEUW: eerste 5 subtiel markeren
    if (index < 5) {
      card.classList.add("is-top-match");
    }

    const ratingHtml = renderRating(company);
    const badgeHtml = index < 5
      ? `<span class="top-match-badge">Beste match</span>`
      : "";

    card.innerHTML = `
      <label class="company-select">
        <input type="checkbox" class="company-checkbox" />
        <div class="company-info">
          <div class="company-header">
            <h3>${escapeHtml(company.name)}</h3>
            ${badgeHtml}
          </div>
          ${ratingHtml}
          <div class="company-city">${escapeHtml(company.city)}</div>
        </div>
      </label>
    `;

    const checkbox = card.querySelector("input[type=checkbox]");
    checkbox.addEventListener("change", () => {
      selected += checkbox.checked ? 1 : -1;
      if (selected > 5) {
        checkbox.checked = false;
        selected--;
        return;
      }
      countEl.textContent = `${selected} van 5 geselecteerd`;
      sendBtn.disabled = selected === 0;
    });

    listEl.appendChild(card);
  });
}
