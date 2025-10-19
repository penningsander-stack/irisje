// frontend/js/secure.js
// ============================================
// Centrale beveiliging + automatische cache-forcering
// ============================================

// 1️⃣ Automatische cache-buster voor alle JS-bestanden
(function () {
  document.querySelectorAll("script[src]").forEach((script) => {
    const url = new URL(script.src);
    // Alleen toepassen op scripts van jouw frontend-domein
    if (url.origin.includes("irisje-frontend.onrender.com")) {
      if (!url.searchParams.has("v")) {
        url.searchParams.set("v", new Date().toISOString().slice(0, 10));
        const fresh = document.createElement("script");
        fresh.src = url.toString();
        fresh.defer = true;
        document.head.appendChild(fresh);
        script.remove();
      }
    }
  });
})();

// 2️⃣ Tokencontrole — voorkomt dat ingelogde gebruikers direct worden uitgelogd
(function () {
  const token = localStorage.getItem("token");
  const path = window.location.pathname;

  // Toegestane pagina's zonder login
  const publicPages = ["/login.html", "/register.html", "/index.html"];

  // Als geen token aanwezig is, terug naar login
  if (!token && !publicPages.some((p) => path.endsWith(p))) {
    window.location.href = "login.html";
    return;
  }

  // Controleer token op beveiligde pagina's
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        console.warn("🔒 Token verlopen, uitloggen...");
        localStorage.removeItem("token");
        window.location.href = "login.html";
      } else {
        console.log("✅ Token is geldig en behouden");
      }
    } catch (err) {
      console.error("⚠️ Tokencontrole mislukt:", err);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
})();

// 3️⃣ Logoutknop functionaliteit
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("👋 Uitloggen geklikt, token verwijderd.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
  }
});
