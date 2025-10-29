// frontend/js/admin.js
const backendUrl = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const reviewTable = document.querySelector("#review-table-body");
  const messageDiv = document.querySelector("#admin-message");

  async function loadReportedReviews() {
    try {
      const res = await fetch(`${backendUrl}/api/reviews/reported`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const reviews = await res.json();

      reviewTable.innerHTML = "";

      if (!reviews.length) {
        reviewTable.innerHTML = `
          <tr><td colspan="5" class="text-center text-gray-500 p-4">
            Geen gemelde reviews gevonden.
          </td></tr>`;
        return;
      }

      reviews.forEach((rev) => {
        const datum = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString("nl-NL")
          : "-";
        const row = document.createElement("tr");
        row.classList.add("border-b", "hover:bg-indigo-50");
        row.innerHTML = `
          <td class="p-2">${rev.name || "-"}</td>
          <td class="p-2">${"⭐".repeat(rev.rating || 0)}</td>
          <td class="p-2">${rev.message || "-"}</td>
          <td class="p-2">${datum}</td>
          <td class="p-2">
            <button data-id="${rev._id}"
              class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">
              Afgehandeld
            </button>
          </td>`;
        reviewTable.appendChild(row);
      });
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      reviewTable.innerHTML = `
        <tr><td colspan="5" class="text-center text-red-600 p-4">
          Fout bij laden reviews.
        </td></tr>`;
    }
  }

  // ✅ Knop "Afgehandeld"
  document.addEventListener("click", async (e) => {
    if (e.target.matches("button[data-id]")) {
      const id = e.target.getAttribute("data-id");
      try {
        const res = await fetch(`${backendUrl}/api/admin/resolve/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        console.log("✅ Review afgehandeld:", data);
        loadReportedReviews();
      } catch (err) {
        console.error("❌ Fout bij afhandelen review:", err);
      }
    }
  });

  loadReportedReviews();
});
