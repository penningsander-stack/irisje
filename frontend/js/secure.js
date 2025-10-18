// frontend/js/secure.js
(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    // Geen token? Terug naar login
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${window.ENV.API_BASE}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    // Token ongeldig → terug naar login
    if (!data.valid) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    // Token geldig, laad dashboardgegevens
    const companyName = localStorage.getItem("companyName") || "Bedrijf";
    const companyEmail = localStorage.getItem("companyEmail") || "";
    const companyCategory = localStorage.getItem("companyCategory") || "";

    document.querySelector("[data-company-name]").textContent = companyName;
    document.querySelector("[data-company-email]").textContent = companyEmail;
    document.querySelector("[data-company-category]").textContent = companyCategory;
  } catch (err) {
    console.error("❌ Secure.js fout:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
})();
