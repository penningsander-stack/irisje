// frontend/js/results.js

const params = new URLSearchParams(window.location.search);
const requestId = params.get("requestId");

async function loadRequestContext() {
  if (!requestId) return;

  const res = await fetch(`/api/publicRequests/${requestId}`);
  const data = await res.json();

  if (!data.request) return;

  const { sector, city } = data.request;

  const titleEl = document.getElementById("resultsTitle");
  if (!titleEl) return;

  titleEl.textContent = city
    ? `${capitalize(sector)} in ${city}`
    : capitalize(sector);
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

loadRequestContext();
