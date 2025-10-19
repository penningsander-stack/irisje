// frontend/js/dashboard.js
const API = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

// Helper om API-aanroepen met token te doen
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  // Probeer JSON te lezen, maar voorkom crash bij HTML- of lege response
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = [];
  }
  return data;
}

// Laad bedrijfsgegevens + aanvragen + reviews
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Laad bedrijfsinformatie
    const me = await apiFetch(`${API}/api/auth/me`);
    const company = me?.company;
    if (company) {
      document.querySelector("[data-company-name]").textContent = company.name || "";
      document.querySelector("[data-company-email]").textContent = company.email || "";
      document.querySelector("[data-company-category]").textContent = company.category || "";
    }

    // Laad aanvragen
    const requests = await apiFetch(`${API}/api/requests/company`);
    renderRequests(requests);

    // Laad reviews
    const reviews = await apiFetch(`${API}/api/reviews/company`);
    renderReviews(reviews);
  } catch (err) {
    console.error("Dashboard-fout:", err);
  }
});

// ✅ Aanvragen tabel renderen
function renderRequests(requests = []) {
  const tbody = document.querySelector("#requests-table tbody");
  if (!tbody) return;

  if (!requests.length) {
    tbody.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = requests
    .map(
      (r) => `
      <tr>
        <td>${r.name || "-"}</td>
        <td>${r.email || "-"}</td>
        <td>${r.message || "-"}</td>
        <td>${r.status || "Nieuw"}</td>
        <td>${new Date(r.createdAt).toLocaleDateString("nl-NL")}</td>
        <td><button class="status-btn" data-id="${r._id}">Bijwerken</button></td>
      </tr>`
    )
    .join("");
}

// ✅ Reviews tabel renderen
function renderReviews(reviews = []) {
  const tbody = document.querySelector("#reviews-table tbody");
  if (!tbody) return;

  if (!reviews.length) {
    tbody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    return;
  }

  tbody.innerHTML = reviews
    .map(
      (rev) => `
      <tr>
        <td>${rev.name || "-"}</td>
        <td>${rev.rating || "-"}</td>
        <td>${rev.message || "-"}</td>
        <td>${new Date(rev.createdAt).toLocaleDateString("nl-NL")}</td>
        <td><button class="report-btn" data-id="${rev._id}">Melden</button></td>
      </tr>`
    )
    .join("");
}
