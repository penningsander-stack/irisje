document.addEventListener("DOMContentLoaded", async () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const userName = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");

  async function loadProfile() {
    try {
      const res = await axios.get(`${apiBase}/api/secure/profile`, { withCredentials: true });
      const user = res.data;
      userName.textContent = user.name || "Bedrijf";
    } catch (err) {
      console.error(err);
      userName.textContent = "Onbekend";
    }
  }

  logoutBtn.addEventListener("click", async () => {
    try {
      await axios.post(`${apiBase}/api/auth/logout`, {}, { withCredentials: true });
      window.location.href = "login.html";
    } catch {
      alert("Uitloggen mislukt.");
    }
  });

  await loadProfile();
});
