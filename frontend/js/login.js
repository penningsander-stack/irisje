// frontend/js/login.js

const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const messageEl = document.getElementById("loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    messageEl.textContent = "Bezig met inloggen...";
    messageEl.className = "text-gray-500 text-sm";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      // 🔹 Inloggen
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ongeldige inloggegevens");

      // ✅ Login geslaagd
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", data.role || "company");

      // 🔍 Bedrijf zoeken op e-mail
      let companyId = "";
      let companyRes = await fetch(`${API_BASE}/companies/byEmail/${encodeURIComponent(email)}`);
      let companyData = await companyRes.json();

      if (companyRes.ok && companyData && companyData._id) {
        companyId = companyData._id;
        console.log("Bedrijf gevonden via e-mailadres:", companyData.name);
      } else {
        // 🔹 Als geen match — probeer via 'owner'
        const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
        const ownerData = await ownerRes.json();
        if (ownerRes.ok && ownerData.length > 0) {
          companyId = ownerData[0]._id;
          console.log("Bedrijf gevonden via eigenaar:", ownerData[0].name);
        }
      }

      if (companyId) {
        localStorage.setItem("companyId", companyId);
        console.log("CompanyId opgeslagen:", companyId);
      } else {
        console.warn("Geen bedrijf gekoppeld aan dit account.");
      }

      messageEl.textContent = "✅ Ingelogd! Even geduld...";
      messageEl.className = "text-green-600 text-sm";

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } catch (err) {
      console.error("Inlogfout:", err);
      messageEl.textContent = "❌ " + err.message;
      messageEl.className = "text-red-600 text-sm";
    }
  });
});
