// frontend/js/secure.js
(function () {
  const API = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

  // Beschermde pagina's: controleer token
  const protectedPages = [
    "dashboard.html",
    "admin.html",
    "company.html",
    "ad-company.html",
  ];
  const isProtected = protectedPages.some((p) =>
    window.location.pathname.endsWith(p)
  );

  const token = localStorage.getItem("token");
  if (isProtected && !token) {
    window.location.href = "login.html";
    return;
  }

  // Uitloggen-knop
  document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn =
      document.getElementById("logoutBtn") || document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("companyId");
          localStorage.removeItem("companyName");
          localStorage.removeItem("companyEmail");
          localStorage.removeItem("companyCategory");
        } catch {}
        window.location.href = "login.html";
      });
    }
  });

  // Kleine ping om token te “touch”-en (optioneel)
  console.log("✅ Token is geldig en behouden");
})();
