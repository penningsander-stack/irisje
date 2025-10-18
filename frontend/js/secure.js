// frontend/js/secure.js
const API = window.ENV.API_BASE;

// Controleer token bij laden pagina
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("🔒 Geen token gevonden – terug naar login.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch(`${API}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!data.valid) {
      console.warn("⚠️ Ongeldige of verlopen token – uitloggen.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("Fout bij token-verificatie:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});

// Hulpfunctie om altijd requests mét token te doen
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    throw new Error("Geen token beschikbaar");
  }

  const headers = options.headers || {};
  headers.Authorization = `Bearer ${token}`;
  headers["Content-Type"] = headers["Content-Type"] || "application/json";

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    console.warn("⚠️ 401 Unauthorized – uitloggen.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
  return res;
}
