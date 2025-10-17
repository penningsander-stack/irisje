// frontend/js/admin.js
document.addEventListener("DOMContentLoaded", () => {
  const reviewsBody = document.getElementById("reviewsBody");

  // Dummy admin token (kan later echte login worden)
  const ADMIN_TOKEN = "irisje_admin_2025";

  document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "login.html";
  });

  async function loadReviews() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/admin/reported-reviews`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      const data = await res.json();

      reviewsBody.innerHTML = "";

      if (!data.length) {
        reviewsBody.innerHTML = `<tr><td colspan="6">Geen gemelde reviews.</td></tr>`;
        return;
      }

      data.forEach((r) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.companyName || "(onbekend)"}</td>
          <td>${r.name}</td>
          <td>${"⭐".repeat(r.rating)}</td>
          <td>${r.message}</td>
          <td>${new Date(r.date).toLocaleDateString()}</td>
          <td>
            <button class="approve" data-id="${r._id}">Goedkeuren</button>
            <button class="delete" data-id="${r._id}">Verwijderen</button>
          </td>
        `;
        reviewsBody.appendChild(tr);
      });

      document.querySelectorAll(".approve").forEach((btn) =>
        btn.addEventListener("click", () => updateReview(btn.dataset.id, "approve"))
      );
      document.querySelectorAll(".delete").forEach((btn) =>
        btn.addEventListener("click", () => updateReview(btn.dataset.id, "delete"))
      );
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      reviewsBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden reviews.</td></tr>`;
    }
  }

  async function updateReview(id, action) {
    try {
      await fetch(`${window.ENV.API_BASE}/api/admin/review-action/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      loadReviews();
    } catch (err) {
      console.error("Fout bij bijwerken review:", err);
    }
  }

  loadReviews();
});
