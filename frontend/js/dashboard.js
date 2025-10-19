// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  let company = {};
  try {
    const raw = localStorage.getItem("company");
    company = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Kon company-info niet parsen, lokale data hersteld.");
    localStorage.removeItem("company");
    company = {};
  }

  // ✅ Controle of token bestaat
  if (!token) {
    console.warn("Geen token, doorverwijzen naar login...");
    window.location.href = "login.html";
    return;
  }

  // ✅ Bedrijfsgegevens invullen
  document.querySelector("[data-company-name]").textContent = company?.name || "";
  document.querySelector("[data-company-email]").textContent = company?.email || "";
  document.querySelector("[data-company-category]").textContent = company?.category || "";
  document.getElementById("last-login").textContent = new Date().toLocaleString("nl-NL");

  // ✅ Uitlogknop
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ✅ Laden aanvragen
  try {
    const res = await fetch(`${API_BASE}/api/requests/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text(); // <-- eerst tekst uitlezen
    console.log("Ruwe response aanvragen:", text);
    const requests = JSON.parse(text);
    console.log("Aanvragen:", requests);
  } catch (err) {
    console.error("Fout bij aanvragen:", err);
  }

  // ✅ Laden reviews
  try {
    const res = await fetch(`${API_BASE}/api/reviews/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    console.log("Ruwe response reviews:", text);
    const reviews = JSON.parse(text);
    console.log("Reviews:", reviews);
  } catch (err) {
    console.error("Fout bij reviews:", err);
  }
});
