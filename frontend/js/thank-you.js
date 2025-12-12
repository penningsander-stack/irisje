// frontend/js/thank-you.js
// v20251212 - leest irisje_thankyou uit sessionStorage en toont premium bevestiging

(function () {
  const statusEl = document.getElementById("thankStatus");
  const summaryEl = document.getElementById("requestSummary");
  const companiesEl = document.getElementById("sentCompanies");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  let raw;
  try {
    raw = sessionStorage.getItem("irisje_thankyou");
  } catch (e) {
    raw = null;
  }

  if (!raw) {
    setStatus("We konden geen recente aanvraag vinden. Probeer het opnieuw vanaf de beginpagina.");
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    setStatus("Er ging iets mis bij het laden van je aanvraag.");
    return;
  }

  if (!data || !data.ok || !data.request) {
    setStatus("Er is geen geldige aanvraag gevonden.");
    return;
  }

  const req = data.request;
  const sentTo = Array.isArray(data.sentTo) ? data.sentTo : [];

  setStatus("Je aanvraag is verstuurd.");

  if (summaryEl) {
    const parts = [];

    if (req.category) parts.push(req.category);
    if (req.city) parts.push(req.city);

    const title = parts.length
      ? `Je aanvraag voor ${parts.join(" in ")}`
      : "Je aanvraag is succesvol verstuurd";

    summaryEl.innerHTML = `
      <h2 class="text-xl md:text-2xl font-semibold text-gray-900 mb-2">${title}</h2>
      <p class="text-gray-600 mb-2">
        We hebben je aanvraag doorgestuurd naar de door jou gekozen bedrijven.
        Zij nemen zo snel mogelijk rechtstreeks contact met je op.
      </p>
      <p class="text-gray-600">
        Naam: <span class="font-medium">${req.name || "-"}</span><br>
        E-mail: <span class="font-medium break-all">${req.email || "-"}</span><br>
        ${req.message ? `<span class="block mt-2 text-gray-700">Omschrijving: ${req.message}</span>` : ""}
      </p>
    `;
  }

  if (companiesEl) {
    companiesEl.innerHTML = "";

    if (!sentTo.length) {
      companiesEl.innerHTML =
        '<p class="text-gray-600">Er zijn (nog) geen specifieke bedrijven gekoppeld aan deze aanvraag.</p>';
      return;
    }

    const list = document.createElement("div");
    list.className = "grid gap-4";

    sentTo.forEach((c) => {
      const card = document.createElement("article");
      card.className =
        "rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3";

      const rating =
        c.rating && c.rating > 0
          ? `<span class="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
               ★ ${c.rating.toFixed ? c.rating.toFixed(1) : c.rating} (${c.reviewCount || 0} reviews)
             </span>`
          : "";

      const city = c.city
        ? `<p class="text-sm text-gray-500">${c.city}</p>`
        : "";

      const slugLink = c.slug
        ? `<a href="/company.html?slug=${encodeURIComponent(
            c.slug
          )}" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Bekijk profiel</a>`
        : "";

      card.innerHTML = `
        <div>
          <h3 class="text-base font-semibold text-gray-900">${c.name}</h3>
          ${city}
          ${rating}
        </div>
        <div class="flex flex-col items-start sm:items-end gap-2">
          ${slugLink}
        </div>
      `;

      list.appendChild(card);
    });

    companiesEl.appendChild(list);
  }

  // Optionele schoonmaak: verwijder de data zodra de pagina ververst is.
  try {
    sessionStorage.removeItem("irisje_thankyou");
  } catch (e) {}
})();
