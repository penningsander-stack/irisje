// frontend/js/secure.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${window.ENV.API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const company = await res.json();

    // Vul bedrijfsinfo op dashboard in
    const nameEl = document.querySelector("[data-company-name]");
    const emailEl = document.querySelector("[data-company-email]");
    const categoryEl = document.querySelector("[data-company-category]");
    const dateEl = document.querySelector("[data-company-lastlogin]");

    if (nameEl) nameEl.textContent = company.name || "";
    if (emailEl) emailEl.textContent = company.email || "";
    if (categoryEl) categoryEl.textContent = company.category || "";
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString("nl-NL");

  } catch (err) {
    console.error("Beveiligingsfout:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});
