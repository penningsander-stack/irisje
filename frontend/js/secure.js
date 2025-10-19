// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const companyData = localStorage.getItem("company");

  // ✅ Als token of bedrijfsgegevens ontbreken → terug naar login
  if (!token || !companyData) {
    console.warn("Geen geldige sessie gevonden. Doorverwijzen naar login...");
    window.location.href = "login.html";
    return;
  }

  // ✅ Eventueel token checken bij backend (optioneel)
  // (Je kunt deze fetch uitzetten als je lokaal test)
  fetch("https://irisje-backend.onrender.com/api/secure/verify", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("Token ongeldig — uitloggen.");
        localStorage.removeItem("token");
        localStorage.removeItem("company");
        window.location.href = "login.html";
      }
    })
    .catch(() => {
      console.log("Verificatie niet gelukt — ga verder met lokale sessie.");
    });
});
