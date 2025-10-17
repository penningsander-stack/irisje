// frontend/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  const errorMsg = document.getElementById("errorMsg");

  btn.addEventListener("click", async () => {
    errorMsg.textContent = "";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorMsg.textContent = "Vul je e-mail en wachtwoord in.";
      return;
    }

    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || "Fout bij inloggen.";
        return;
      }

      // ✅ Token opslaan
      localStorage.setItem("token", data.token);
      localStorage.setItem("company", JSON.stringify(data.company));

      // ✅ Doorsturen naar dashboard
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login-fout:", err);
      errorMsg.textContent = "Serverfout of geen verbinding.";
    }
  });
});
