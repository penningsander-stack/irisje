// frontend/js/results.js
// v2026-01-06 RESTORED

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("requestId");
  if (!requestId) return;

  try {
    const res = await fetch(`${API_BASE}/publicRequests/${requestId}`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("Aanvraag niet gevonden");

    console.log("Bedrijven:", data.companies);
  } catch (err) {
    console.error(err);
  }
});
