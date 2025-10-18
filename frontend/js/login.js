// frontend/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("login-message");

    msg.textContent = "";
    msg.style.color = "";

    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        msg.textContent = data.error || "Fout bij inloggen";
        msg.style.color = "red";
        return;
      }

      // Token + bedrijfsgegevens opslaan
      localStorage.setItem("token", data.token);
      localStorage.setItem("companyName", data.company.name);
      localStorage.setItem("companyEmail", data.company.email);
      localStorage.setItem("companyCategory", data.company.category);

      // Naar dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login-fout:", err);
      msg.textContent = "Serverfout of geen verbinding.";
      msg.style.color = "red";
    }
  });
});
