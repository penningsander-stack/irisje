// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const reviewTable = document.querySelector("#reportedReviewsBody");

  // === Gemelde reviews laden ===
  async function loadReportedReviews() {
    try {
      const res = await fetch(`${API_BASE}/admin/reported`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);

      const reviews = await res.json();
      reviewTable.innerHTML = "";

      if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewTable.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-gray-500 p-4">
              Geen gemelde reviews gevonden.
            </td>
          </tr>`;
        return;
      }

      reviews.forEach((rev) => {
        const datum = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";

        const row = document.createElement("tr");
        row.classList.add("border-t", "hover:bg-indigo-50", "transition");
        row.innerHTML = `
          <td class="p-3">${rev.name || "-"}</td>
          <td class="p-3">${"⭐".repeat(rev.rating || 0)}</td>
          <td class="p-3">${rev.message || "-"}</td>
          <td class="p-3">${datum}</td>
          <td class="p-3">
            <button data-id="${rev._id}" 
              class="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition">
              Afgehandeld
            </button>
          </td>`;
        reviewTable.appendChild(row);
      });
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      reviewTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-red-600 p-4">
            Fout bij laden reviews.
          </td>
        </tr>`;
    }
  }

  // === Review afhandelen (markeren als niet meer gemeld) ===
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    btn.disabled = true;
    btn.textContent = "Verwerken...";

    try {
      const res = await fetch(`${API_BASE}/admin/resolve/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);

      console.log(`✅ Review ${id} afgehandeld`);
      await loadReportedReviews();
    } catch (err) {
      console.error("❌ Fout bij afhandelen review:", err);
      btn.disabled = false;
      btn.textContent = "Afgehandeld";
      alert("Er is een fout opgetreden bij het afhandelen van deze review.");
    }
  });

  // === Init ===
  loadReportedReviews();
});
