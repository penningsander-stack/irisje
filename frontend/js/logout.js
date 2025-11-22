// frontend/js/logout.js
// v20251122-JWT-LOCALSTORAGE-LOGOUT
// Cookie-loos uitloggen: lokale sessie wissen + optionele backend-log voor legacy cookies.

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    try {
      // Legacy-center: laat backend evt oude cookie opruimen (geen credentials nodig)
      await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    } catch (e) {
      console.warn("Logout request error:", e);
    } finally {
      // JWT/localStorage sessie wissen
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("companyId");
      localStorage.removeItem("userEmail");
      sessionStorage.clear();

      window.location.href = "login.html";
    }
  });
});
