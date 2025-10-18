// frontend/js/dashboard.js
const API = window.ENV.API_BASE;
const token = localStorage.getItem("token");

if (!token) window.location.href = "login.html";

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

const tableBody = document.querySelector("#requests-table tbody");
const reviewBody = document.querySelector("#reviews-table tbody");
const filter = document.getElementById("filter");

// === DASHBOARD LADEN ===
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/companies/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || "Serverfout");

    document.querySelector("[data-company-name]").textContent = data.company.name;
    document.querySelector("[data-company-email]").textContent = data.company.email;
    document.querySelector("[data-company-category]").textContent = data.company.category;

    document.getElementById("total").textContent = data.stats.total;
    document.getElementById("accepted").textContent = data.stats.accepted;
    document.getElementById("rejected").textContent = data.stats.rejected;
    document.getElementById("followed").textContent = data.stats.followed;

    renderRequests(data.requests);
    renderReviews(data.reviews);
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
  }
}

// === AANVRAGEN ===
function renderRequests(requests) {
  const selected = filter.value;
  const filtered = selected === "Alle" ? requests : requests.filter(r => r.status === selected);

  tableBody.innerHTML = filtered.length
    ? filtered.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td>
          <button class="status-btn" data-id="${r._id}" data-status="Geaccepteerd">✅</button>
          <button class="status-btn" data-id="${r._id}" data-status="Afgewezen">❌</button>
          <button class="status-btn" data-id="${r._id}" data-status="Opgevolgd">🔄</button>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;

  document.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      await updateStatus(btn.dataset.id, btn.dataset.status);
    });
  });
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API}/api/requests/status/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) loadDashboard();
  } catch (err) {
    console.error("Status-update mislukt:", err);
  }
}

// === REVIEWS ===
function renderReviews(reviews) {
  reviewBody.innerHTML = reviews.length
    ? reviews.map(r => `
      <tr>
        <td>${r.name}</td>
        <td>${"⭐".repeat(r.rating)}</td>
        <td>${r.comment}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td><button class="report-btn" data-id="${r._id}">Melden</button></td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;

  document.querySelectorAll(".report-btn").forEach(btn => {
    btn.addEventListener("click", () => reportReview(btn.dataset.id));
  });
}

async function reportReview(id) {
  try {
    const res = await fetch(`${API}/api/reviews/report/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) alert("Review gemeld ✅");
  } catch (err) {
    console.error("Review melden mislukt:", err);
  }
}

filter.addEventListener("change", loadDashboard);
loadDashboard();
