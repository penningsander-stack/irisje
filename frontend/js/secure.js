// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  // Controleer of token bestaat
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Token valideren via backend
  async function verifyToken() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ongeldig of verlopen token
      if (!res.ok) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }

      // Gegevens van ingelogd bedrijf ophalen
      const data = await res.json();
      document.querySelector("[data-company-name]").textContent = data.company.name;
      document.querySelector("[data-company-email]").textContent = data.company.email;
      document.querySelector("[data-company-category]").textContent = data.company.category;
    } catch (err) {
      console.error("Tokencontrole mislukt:", err);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }

  verifyToken();

  // Uitloggen-knop
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
});
