// frontend/app.js
const API = "https://irisje-backend.onrender.com";

const form = document.getElementById("loginForm");
const msg = document.getElementById("message");
const profile = document.getElementById("profile");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Bezig met inloggen...";
  profile.classList.add("hidden");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.message || "Inloggen mislukt";
      return;
    }

    localStorage.setItem("irisje_token", data.token);
    msg.textContent = "✅ Inloggen gelukt!";
    await showProfile();
  } catch (err) {
    msg.textContent = "Fout: " + err.message;
  }
});

async function showProfile() {
  const token = localStorage.getItem("irisje_token");
  if (!token) return;

  try {
    const res = await fetch(`${API}/api/me`, {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = "Token ongeldig, log opnieuw in.";
      localStorage.removeItem("irisje_token");
      return;
    }

    profile.innerHTML = `
      <p><strong>ID:</strong> ${data.user._id}</p>
      <p><strong>Email:</strong> ${data.user.email}</p>
      <p><strong>Rol:</strong> ${data.user.role}</p>
      <p><strong>Aangemaakt:</strong> ${new Date(data.user.createdAt).toLocaleString()}</p>
    `;
    profile.classList.remove("hidden");
  } catch (err) {
    msg.textContent = "Fout bij ophalen profiel.";
  }
}

// Toon profiel automatisch als er al een token is
document.addEventListener("DOMContentLoaded", showProfile);
