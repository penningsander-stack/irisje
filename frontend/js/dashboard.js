document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = (window.ENV && window.ENV.API_BASE) || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  const headers = { Authorization: `Bearer ${token}` };
  const company = JSON.parse(localStorage.getItem("company") || "{}");

  document.getElementById("companyName").textContent = company.name || "Demo Bedrijf";
  document.getElementById("companyEmail").textContent = company.email || "demo@irisje.nl";
  document.getElementById("category").textContent = company.category || "Algemeen";
  document.getElementById("lastLogin").textContent = new Date().toLocaleString("nl-NL");

  const reqBody = document.getElementById("requestsBody");
  const revBody = document.getElementById("reviewsBody");

  try {
    const res = await fetch(`${API_BASE}/api/requests/company`, { headers });
    const data = await res.json();
    reqBody.innerHTML = data.length
      ? data.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.message}</td>
          <td>${r.status}</td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        </tr>`).join("")
      : `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
  } catch (err) {
    reqBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden aanvragen.</td></tr>`;
  }

  try {
    const res = await fetch(`${API_BASE}/api/reviews/company`, { headers });
    const data = await res.json();
    revBody.innerHTML = data.length
      ? data.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${"⭐".repeat(r.rating)}</td>
          <td>${r.message}</td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        </tr>`).join("")
      : `<tr><td colspan="4">Geen reviews gevonden.</td></tr>`;
  } catch (err) {
    revBody.innerHTML = `<tr><td colspan="4">Serverfout bij laden reviews.</td></tr>`;
  }
});
