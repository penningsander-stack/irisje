// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  async function verify() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("company");
        window.location.href = "login.html";
        return;
      }

      const data = await res.json();

      const nameEl = document.querySelector("[data-company-name]") || document.getElementById("companyName");
      const emailEl = document.querySelector("[data-company-email]") || document.getElementById("companyEmail");
      const catEl = document.querySelector("[data-company-category]") || document.getElementById("companyCategory");

      if (nameEl) nameEl.textContent = data.company.name || "";
      if (emailEl) emailEl.textContent = data.company.email || "";
      if (catEl) catEl.textContent = data.company.category || "";
    } catch (err) {
      console.error("Tokencontrole mislukt:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
    }
  }

  verify();

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
    });
  }
});
