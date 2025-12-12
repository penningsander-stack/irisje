// frontend/js/select-companies.js
// v20251211 - fully wired to new backend /api/publicRequests/:id

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

  // Load request
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

  // Search companies
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

  // Render list
  companiesContainer.innerHTML = "";

  companies.forEach((c) => {
    const item = document.createElement("div");
    item.className =
      "company-item p-4 border rounded mb-3 flex justify-between items-center";

    item.innerHTML = `
      <div>
        <strong>${c.name}</strong><br>
        <span>${c.city || ""}</span>
      </div>
      <input type="checkbox" class="company-select" value="${c._id}">
    `;

    companiesContainer.appendChild(item);
  });

  // send requests
  sendBtn.addEventListener("click", async () => {
    const selected = Array.from(
      document.querySelectorAll(".company-select:checked")
    ).map((el) => el.value);

    if (!selected.length) {
      setStatus("Selecteer minstens één bedrijf.");
      return;
    }

    setStatus("Aanvraag versturen...");

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

    setStatus("Aanvragen verstuurd!");
  });
})();
