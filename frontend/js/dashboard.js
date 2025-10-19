// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");
  const company = JSON.parse(localStorage.getItem("company") || "{}");

  // Bedrijfsgegevens tonen
  document.querySelector("[data-company-name]").textContent = company?.name || "";
  document.querySelector("[data-company-email]").textContent = company?.email || "";
  document.querySelector("[data-company-category]").textContent = company?.category || "";

  // Uitloggen
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ✅ Alleen laden als token bestaat
  if (!token) return;

  try {
    // Aanvragen
    const res = await fetch(`${API_BASE}/api/requests/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await res.json();
    console.log("Aanvragen:", requests);
  } catch (err) {
    console.error("Fout bij aanvragen:", err);
  }

  try {
    // Reviews
    const res = await fetch(`${API_BASE}/api/reviews/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reviews = await res.json();
    console.log("Reviews:", reviews);
  } catch (err) {
    console.error("Fout bij reviews:", err);
  }
});
