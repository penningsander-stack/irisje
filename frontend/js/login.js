// frontend/js/login.js
const backendUrl = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();
    const errorBox = document.querySelector("#error-box");

    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Inloggen mislukt");

      // ✅ Sla e-mailadres en rol op voor dashboard
      localStorage.setItem("userEmail", data.email || email);
      localStorage.setItem("userRole", data.role || "bedrijf");

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("❌ Loginfout:", err);
      errorBox.textContent = "❌ " + err.message;
    }
  });
});
