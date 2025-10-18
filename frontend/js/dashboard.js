// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  const companyNameEl = document.getElementById("companyName");
  const companyEmailEl = document.getElementById("companyEmail");
  const categoryEl = document.getElementById("category");
  const lastLoginEl = document.getElementById("lastLogin");
  const requestsBody = document.getElementById("requestsBody");
  const reviewsBody = document.getElementById("reviewsBody");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Haal bedrijfsprofiel op
    const resProfile = await fetch(`${API_BASE}/api/secure/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const company = await resProfile.json();

    if (!company || company.error) throw new Error("Kon bedrijfsgegevens niet laden");

    companyNameEl.textContent = company.name || "Onbekend bedrijf";
    companyEmailEl.textContent = company.email || "";
    categoryEl.textContent = company.category || "Algemeen";
    lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

    // Haal aanvragen op
    const resRequests = await fetch(`${API_BASE}/api/requests/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await resRequests.json();

    requestsBody.innerHTML = "";
    if (Array.isArray(requests) && requests.length > 0) {
      requests.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${r.name || "-"}</td>
          <td>${r.email || "-"}</td>
          <td>${r.message || "-"}</td>
          <td>${r.status || "Nieuw"}</td>
          <td>${new Date(r.createdAt).toLocaleDateString("nl-NL")}</td>
        `;
        requestsBody.appendChild(row);
      });
    } else {
      requestsBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }

    // Haal reviews op
    const resReviews = await fetch(`${API_BASE}/api/reviews/company`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const reviews = await resReviews.json();

    reviewsBody.innerHTML = "";
    if (Array.isArray(reviews) && reviews.length > 0) {
      reviews.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${r.name || "-"}</td>
          <td>${r.rating || "-"}</td>
          <td>${r.message || "-"}</td>
          <td>${new Date(r.createdAt).toLocaleDateString("nl-NL")}</td>
        `;
        reviewsBody.appendChild(row);
      });
    } else {
      reviewsBody.innerHTML = `<tr><td colspan="4">Nog geen reviews.</td></tr>`;
    }
  } catch (err) {
    console.error("Dashboard-fout:", err);
    requestsBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden aanvragen.</td></tr>`;
    reviewsBody.innerHTML = `<tr><td colspan="4">Serverfout bij laden reviews.</td></tr>`;
  }
});

// Uitlogfunctie
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});
