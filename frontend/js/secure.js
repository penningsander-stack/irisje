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
      console.warn("⚠️ Ongeldige token, uitloggen...");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    // Token geldig → bedrijfsinfo tonen
    const nameEl = document.querySelector("[data-company-name]");
    const emailEl = document.querySelector("[data-company-email]");
    const catEl = document.querySelector("[data-company-category]");

    if (nameEl) nameEl.textContent = localStorage.getItem("companyName") || "";
    if (emailEl) emailEl.textContent = localStorage.getItem("companyEmail") || "";
    if (catEl) catEl.textContent = localStorage.getItem("companyCategory") || "";
  } catch (err) {
    console.error("❌ Secure.js fout:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
})();
