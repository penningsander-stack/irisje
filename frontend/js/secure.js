// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const company = localStorage.getItem("company");

  // Als geen token → naar loginpagina
  if (!token) {
    console.warn("Geen token gevonden — doorverwijzing naar login.");
    window.location.href = "login.html";
    return;
  }

  // Token nog even testen
  try {
    const parsed = JSON.parse(atob(token.split(".")[1]));
    const exp = parsed.exp ? parsed.exp * 1000 : null;
    if (exp && Date.now() > exp) {
      console.warn("Token verlopen — doorverwijzing naar login.");
      localStorage.removeItem("token");
      localStorage.removeItem("company");
      window.location.href = "login.html";
      return;
    }
  } catch (e) {
    console.error("Ongeldig token — doorverwijzing naar login.", e);
    localStorage.removeItem("token");
    localStorage.removeItem("company");
    window.location.href = "login.html";
    return;
  }

  console.log("✅ Token is geldig en behouden");
});
