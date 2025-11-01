// frontend/js/login.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Al ingelogd? → direct doorsturen
  if (localStorage.getItem("userEmail")) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      msg.textContent = "❌ Vul zowel e-mail als wachtwoord in.";
      msg.className = "text-red-600 text-center text-sm";
      return;
    }

    msg.textContent = "⏳ Bezig met inloggen...";
    msg.className = "text-gray-500 text-center text-sm";

    try {
      // 🔹 Inloggen bij backend
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Ongeldige inloggegevens.");

      // ✅ Login geslaagd
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", data.role || "company");

      // 🔹 Bedrijf ophalen (via e-mail of eigenaar)
      let companyId = "";
      let companyName = "";

      const tryFetch = async (url) => {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await r.json();
      };

      const byEmail = await tryFetch(`${API_BASE}/companies/byEmail/${encodeURIComponent(email)}`);
      if (byEmail && byEmail._id) {
        companyId = byEmail._id;
        companyName = byEmail.name || "Bedrijf";
        console.info("✅ Bedrijf gevonden via e-mailadres:", companyName);
      } else {
        const byOwner = await tryFetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
        if (Array.isArray(byOwner) && byOwner.length > 0) {
          companyId = byOwner[0]._id;
          companyName = byOwner[0].name || "Bedrijf";
          console.info("✅ Bedrijf gevonden via eigenaar:", companyName);
        }
      }

      if (companyId) {
        localStorage.setItem("companyId", companyId);
        localStorage.setItem("companyName", companyName);
      } else {
        console.warn("⚠️ Geen gekoppeld bedrijf gevonden voor dit account.");
      }

      // ✅ Succesmelding en doorsturen
      msg.textContent = "✅ Ingelogd! Even geduld...";
      msg.className = "text-green-600 text-center text-sm";

      setTimeout(() => (window.location.href = "dashboard.html"), 900);
    } catch (err) {
      console.error("❌ Inlogfout:", err);
      msg.textContent = "❌ " + (err.message || "Er ging iets mis bij het inloggen.");
      msg.className = "text-red-600 text-center text-sm";
    }
  });
});
