// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = (window.ENV && window.ENV.API_BASE) || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const company = JSON.parse(localStorage.getItem("company") || "{}");

  const el = (id) => document.getElementById(id);
  const reqBody = el("requestsBody");
  const revBody = el("reviewsBody");

  el("companyName").textContent = company.name || "Demo Bedrijf";
  el("companyEmail").textContent = company.email || "demo@irisje.nl";
  el("category").textContent = company.category || "Algemeen";
  el("lastLogin").textContent = new Date().toLocaleString("nl-NL");

  async function safeFetch(url) {
    try {
      const res = await fetch(url, { headers });
      const txt = await res.text();
      console.log("🔍 Response van", url, "=", txt);
      if (!res.ok) throw new Error(res.status + " " + res.statusText);
      return JSON.parse(txt);
    } catch (e) {
      console.error("❌ Fout bij ophalen:", e);
      return [];
    }
  }

  function renderRequests(data) {
    if (!data.length) {
      reqBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
      return;
    }
    reqBody.innerHTML = data.map(r => `
      <tr>
        <td>${r.name || "-"}</td>
        <td>${r.email || "-"}</td>
        <td>${r.message || "-"}</td>
        <td>${r.status || "Nieuw"}</td>
        <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
      </tr>`).join("");
  }

  function renderReviews(data) {
    if (!data.length) {
      revBody.innerHTML = `<tr><td colspan="4">Geen reviews gevonden.</td></tr>`;
      return;
    }
    revBody.innerHTML = data.map(r => `
      <tr>
        <td>${r.name || "-"}</td>
        <td>${"⭐".repeat(Number(r.rating) || 0)}</td>
        <td>${r.message || "-"}</td>
        <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
      </tr>`).join("");
  }

  const requests = await safeFetch(`${API_BASE}/api/requests/company`);
  const reviews = await safeFetch(`${API_BASE}/api/reviews/company`);

  renderRequests(requests);
  renderReviews(reviews);
});
