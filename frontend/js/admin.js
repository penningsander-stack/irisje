// frontend/js/admin.js
console.log("📋 Admin-dashboard geladen");

const API = window.ENV?.API_BASE || "";
const tableBody = document.querySelector("#reportedReviewsTable tbody");

async function loadReportedReviews() {
  try {
    const res = await fetch(`${API}/api/admin/reported-reviews`);
    const data = await res.json();
    console.log("💬 Gemelde reviews:", data);

    if (!data.length) {
      tableBody.innerHTML = `<tr><td colspan="5">Geen gemelde reviews gevonden.</td></tr>`;
      return;
    }

    tableBody.innerHTML = data
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${"⭐".repeat(r.rating)}</td>
        <td>${r.message}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td>
          <button class="approve-btn" onclick="approveReview('${r._id}')">Goedkeuren</button>
          <button class="delete-btn" onclick="deleteReview('${r._id}')">Verwijderen</button>
        </td>
      </tr>`
      )
      .join("");
  } catch (err) {
    console.error("Fout bij laden reviews:", err);
    tableBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden reviews.</td></tr>`;
  }
}

async function approveReview(id) {
  if (!confirm("Weet je zeker dat je deze review wilt goedkeuren?")) return;
  const res = await fetch(`${API}/api/admin/reviews/${id}/approve`, { method: "PATCH" });
  const data = await res.json();
  alert(data.message || "Review goedgekeurd.");
  loadReportedReviews();
}

async function deleteReview(id) {
  if (!confirm("Weet je zeker dat je deze review wilt verwijderen?")) return;
  const res = await fetch(`${API}/api/admin/reviews/${id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.message || "Review verwijderd.");
  loadReportedReviews();
}

loadReportedReviews();
