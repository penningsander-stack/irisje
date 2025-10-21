// frontend/js/dashboard.js
console.log("📊 Dashboard geladen");

const API = window.ENV?.API_BASE || "";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("✅ Token is geldig en behouden");

    // 🔹 Aanvragen ophalen (fake/test)
    const reqRes = await fetch(`${API}/api/requests/company`);
    const requests = await reqRes.json();
    console.log("📬 Ruwe response aanvragen:", requests);

    const tbody = document.querySelector("#requestsBody");
    if (requests && requests.length) {
      tbody.innerHTML = requests
        .map(
          (r) => `
        <tr>
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.message}</td>
          <td>${r.status}</td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        </tr>`
        )
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }

    // 🔹 Reviews ophalen
    const revRes = await fetch(`${API}/api/reviews/company`);
    const reviews = await revRes.json();
    console.log("💬 Ruwe response reviews:", reviews);

    const revBody = document.querySelector("#reviewsBody");
    if (reviews && reviews.length) {
      revBody.innerHTML = reviews
        .map(
          (r) => `
        <tr>
          <td>${r.name}</td>
          <td>${"⭐".repeat(r.rating)}</td>
          <td>${r.message}</td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
          <td><button class="report-btn" onclick="reportReview('${r._id}')">Meld review</button></td>
        </tr>`
        )
        .join("");
    } else {
      revBody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    }
  } catch (err) {
    console.error("Dashboard-fout:", err);
  }
});

// ✅ Review melden (PATCH)
async function reportReview(id) {
  if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;
  try {
    const res = await fetch(`${API}/api/reviews/${id}/report`, { method: "PATCH" });
    const data = await res.json();
    alert(data.message || "Review gemeld.");
  } catch (err) {
    alert("Fout bij melden review.");
    console.error(err);
  }
}

// ✅ Uitloggen
document.querySelector("#logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});
