// frontend/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("loginBtn");
  const errorDiv = document.getElementById("error");

  btn.addEventListener("click", async () => {
    errorDiv.textContent = "";
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      errorDiv.textContent = "Vul zowel e-mail als wachtwoord in.";
      return;
    }

    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          errorDiv.textContent = data.error || "Ongeldig e-mailadres of wachtwoord.";
        } else {
          errorDiv.textContent = data.error || "Serverfout of geen verbinding.";
        }
        return;
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      window.location.href = "dashboard.html";
    } catch (err) {
      console.error("Login-fout:", err);
      errorDiv.textContent = "Serverfout of geen verbinding.";
    }
  });
});
