// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn") || document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("👋 Uitloggen...");
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
    });
  }

  const token = localStorage.getItem("token");
  const path = window.location.pathname;
  const publicPages = ["/login.html", "/register.html", "/index.html", "/"];

  if (!token && !publicPages.some((p) => path.endsWith(p))) {
    window.location.href = "login.html";
    return;
  }

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Date.now() / 1000;
      if (payload.exp && payload.exp < now) {
        console.warn("🔒 Token verlopen");
        localStorage.removeItem("token");
        window.location.href = "login.html";
      } else {
        console.log("✅ Token is geldig en behouden");
      }
    } catch (e) {
      console.error("⚠️ Tokencontrole mislukt:", e);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
});
