// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const companyData = localStorage.getItem("company");

  // Geen token → uitloggen
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Functie: token controleren bij backend
  async function verifyToken() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn("Token ongeldig, uitloggen...");
        localStorage.removeItem("token");
        localStorage.removeItem("company");
        window.location.href = "login.html";
        return;
      }

      const data = await res.json();

      // Bedrijfsgegevens invullen
      document.querySelector("[data-company-name]").textContent = data.company.name;
      document.querySelector("[data-company-email]").textContent = data.company.email;
      document.querySelector("[data-company-category]").textContent = data.company.category;

    } catch (err) {
      console.error("Tokencontrole mislukt:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
    }
  }

  verifyToken();

  // Uitloggen
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
    });
  }
});
