// frontend/js/select-companies.js
// v20251212 - publicRequests + send-requests + thank-you flow

(async function () {
  const API = "https://irisje-backend.onrender.com";

  function $(id) {
    return document.getElementById(id);
  }

  const companiesContainer = $("companiesContainer");
  const statusBox = $("statusBox");
  const sendBtn = $("sendRequestsBtn");

  function setStatus(msg) {
    if (statusBox) statusBox.textContent = msg || "";
  }

  function getParam(key) {
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  }

  async function fetchJSON(url) {
    try {
      const res = await fetch(url);
      return await res.json();
    } catch {
      return null;
    }
  }

  // 1. Aanvraag ophalen
  const requestId = getParam("requestId");
  if (!requestId) {
    setStatus("Geen aanvraag-ID gevonden.");
    return;
  }

  setStatus("Aanvraag laden...");

  const reqData = await fetchJSON(`${API}/api/publicRequests/${requestId}`);
  if (!reqData || !reqData.ok) {
    setStatus("Aanvraag niet gevonden.");
    return;
  }

  const request = reqData.request;
  const category = request.category || "";
  const city = request.city || "";

  if (!category || !city) {
    setStatus("Onvoldoende gegevens om bedrijven te zoeken.");
    return;
  }

  setStatus("Bedrijven zoeken...");

  // 2. Bedrijven zoeken op basis van categorie + plaats
  const searchUrl = `${API}/api/companies/search?category=${encodeURIComponent(
    category
  )}&city=${encodeURIComponent(city)}`;

  const companiesData = await fetchJSON(searchUrl);

  if (!companiesData || !companiesData.ok || !Array.isArray(companiesData.results)) {
    setStatus("Kon geen bedrijven vinden.");
    return;
  }

  const companies = companiesData.results;

  if (!companies.length) {
    setStatus("Geen bedrijven gevonden voor deze aanvraag.");
    return;
  }

  setStatus("");

  // 3. Lijst renderen
  if (!companiesContainer) {
    console.warn("Geen #companiesContainer gevonden in HTML.");
    return;
  }

  companiesContainer.innerHTML = "";

  companies.forEach((c) => {
    const item = document.createElement("div");
    item.className =
      "company-item p-4 border rounded mb-3 flex justify-between items-center gap-4 bg-white shadow-sm";

    const cityLabel = c.city ? `<span class=\"text-sm text-gray-500\">${c.city}</span>` : "";

    item.innerHTML = `
      <div>
        <div class=\"font-semibold text-gray-900\">${c.name}</div>
        ${cityLabel}
      </div>
      <div>
        <input type=\"checkbox\" class=\"company-select h-5 w-5\" value=\"${c._id}\">
      </div>
    `;

    companiesContainer.appendChild(item);
  });

  if (!sendBtn) {
    console.warn("Geen #sendRequestsBtn gevonden in HTML.");
    return;
  }

  // 4. Aanvragen versturen
  sendBtn.addEventListener("click", async () => {
    const selected = Array.from(
      document.querySelectorAll(".company-select:checked")
    ).map((el) => el.value);

    if (!selected.length) {
      setStatus("Selecteer minstens één bedrijf.");
      return;
    }

    setStatus("Aanvraag versturen...");

    try {
      const res = await fetch(`${API}/api/companies/send-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          companyIds: selected,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data || !data.ok) {
        setStatus("Kon aanvragen niet versturen.");
        return;
      }

      // Bewaar data voor de bedankt-pagina
      try {
        sessionStorage.setItem("irisje_thankyou", JSON.stringify(data));
      } catch (e) {
        console.warn("Kon irisje_thankyou niet in sessionStorage opslaan:", e);
      }

      // Doorsturen naar bedankt-pagina
      window.location.href = "/thank-you.html";
    } catch (err) {
      console.error("Fout bij versturen aanvragen:", err);
      setStatus("Er ging iets mis bij het versturen van de aanvragen.");
    }
  });
})();
