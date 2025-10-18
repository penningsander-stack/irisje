// frontend/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorDiv = document.getElementById("errorMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorDiv.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        errorDiv.textContent = data.error || "Fout bij inloggen.";
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("company", JSON.stringify(data.company));

      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login-fout:", err);
      errorDiv.textContent = "Serverfout of geen verbinding.";
    }
  });
});
