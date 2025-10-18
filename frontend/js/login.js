// frontend/js/login.js
const API = window.ENV.API_BASE;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("error");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorBox.textContent = "Vul alle velden in.";
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        errorBox.textContent = data.error || "Ongeldige inloggegevens.";
        return;
      }

      // Token veilig opslaan
      localStorage.setItem("token", data.token);

      // Doorsturen naar dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login-fout:", err);
      errorBox.textContent = "Serverfout of geen verbinding.";
    }
  });
});
