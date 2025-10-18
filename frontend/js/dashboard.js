// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "login.html");

  const companyName = document.getElementById("companyName");
  const companyEmail = document.getElementById("companyEmail");
  const category = document.getElementById("category");
  const lastLogin = document.getElementById("lastLogin");
  const requestsBody = document.getElementById("requestsBody");
  const reviewsBody = document.getElementById("reviewsBody");

  try {
    // bedrijfsgegevens
    const resCompany = await fetch(`${API_BASE}/api/secure/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const company = await resCompany.json();
    companyName.textContent = company.name ?? "Onbekend bedrijf";
    companyEmail.textContent = company.email ?? "";
    category.textContent = company.category ?? "Algemeen";
    lastLogin.textContent = new Date().toLocaleString("nl-NL");

    // aanvragen
    const resRequests = await fetch(`${API_BASE}/api/requests/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await resRequests.json();
    requestsBody.innerHTML = "";
    if (Array.isArray(requests) && requests.length > 0) {
      requests.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.name || "-"}</td>
          <td>${r.email || "-"}</td>
          <td>${r.message || "-"}</td>
          <td>${r.status || "Nieuw"}</td>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString("nl-NL") : "-"}</td>`;
        requestsBody.appendChild(tr);
      });
    } else {
      requestsBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }

    // reviews
    const resReviews = await fetch(`${API_BASE}/api/reviews/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reviews = await resReviews.json();
    reviewsBody.innerHTML = "";
    if (Array.isArray(reviews) && reviews.length > 0) {
      reviews.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.name || "-"}</td>
          <td>${r.rating || "-"}</td>
          <td>${r.message || "-"}</td>
          <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString("nl-NL") : "-"}</td>`;
        reviewsBody.appendChild(tr);
      });
    } else {
      reviewsBody.innerHTML = `<tr><td colspan="4">Nog geen reviews gevonden.</td></tr>`;
    }
  } catch (err) {
    console.error("Dashboard-fout:", err);
    requestsBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden aanvragen.</td></tr>`;
    reviewsBody.innerHTML = `<tr><td colspan="4">Serverfout bij laden reviews.</td></tr>`;
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});
