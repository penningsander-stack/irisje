document.addEventListener("DOMContentLoaded", () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMessage");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    msg.textContent = "Inloggen...";
    try {
      const res = await axios.post(`${apiBase}/api/auth/login`, { email, password }, { withCredentials: true });
      if (res.data.success) {
        msg.textContent = "✅ Ingelogd, even geduld...";
        setTimeout(() => (window.location.href = "dashboard.html"), 1000);
      } else {
        msg.textContent = "❌ Onjuiste inloggegevens.";
      }
    } catch (err) {
      console.error(err);
      msg.textContent = "❌ Inloggen mislukt.";
    }
  });
});
