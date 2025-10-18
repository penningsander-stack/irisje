// frontend/js/secure.js
(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${window.ENV.API_BASE}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.valid) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    // Token geldig → bedrijfsinfo vullen
    document.querySelector("[data-company-name]").textContent =
      localStorage.getItem("companyName") || "Bedrijf";
    document.querySelector("[data-company-email]").textContent =
      localStorage.getItem("companyEmail") || "";
    document.querySelector("[data-company-category]").textContent =
      localStorage.getItem("companyCategory") || "";
  } catch (err) {
    console.error("❌ Secure.js fout:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
})();
