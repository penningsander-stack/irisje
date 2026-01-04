// frontend/js/results.js
// v2026-01-06 SAFE

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return;

  const res = await fetch(
    `https://irisje-backend.onrender.com/api/publicRequests/${requestId}`
  );
  const data = await res.json();
  if (!data.ok) return;

  console.log("Bedrijven:", data.companies);
});
