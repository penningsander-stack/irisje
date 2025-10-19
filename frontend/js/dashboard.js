// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  let company = {};
  try {
    const raw = localStorage.getItem("company");
    company = raw ? JSON.parse(raw) : {};
  } catch {
    console.warn("Kon company-info niet parsen, lokale data hersteld.");
    localStorage.removeItem("company");
    company = {};
  }

  // ✅ Controleer of token bestaat
  if (!token) {
    console.warn("Geen token, doorverwijzen naar login...");
    window.location.href = "login.html";
    return;
  }

  // ✅ Veilig invullen van velden
  const nameEl = document.querySelector("[data-company-name]");
  const emailEl = document.querySelector("[data-company-email]");
  const catEl = document.querySelector("[data-company-category]");
  const lastLoginEl = document.getElementById("last-login");

  if (nameEl) nameEl.textContent = company?.name || "Onbekend bedrijf";
  if (emailEl) emailEl.textContent = company?.email || "—";
  if (catEl) catEl.textContent = company?.category || "Algemeen";
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

  // ✅ Uitloggen
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // ✅ Aanvragen ophalen
  try {
    const res = await fetch(`${API_BASE}/api/requests/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    console.log("📬 Ruwe response aanvragen:", text);
    const requests = JSON.parse(text);
    console.log("Aanvragen:", requests);
  } catch (err) {
    console.error("Fout bij aanvragen:", err);
  }

  // ✅ Reviews ophalen
  try {
    const res = await fetch(`${API_BASE}/api/reviews/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    console.log("💬 Ruwe response reviews:", text);
    const reviews = JSON.parse(text);
    console.log("Reviews:", reviews);
  } catch (err) {
    console.error("Fout bij reviews:", err);
  }
});
