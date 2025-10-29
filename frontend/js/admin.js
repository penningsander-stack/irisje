// frontend/js/admin.js
const backendUrl = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("reported-reviews-body");

  // 🔹 Reviews laden
  async function loadReportedReviews() {
    try {
      const res = await fetch(`${backendUrl}/api/reviews/reported`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);
      const reviews = await res.json();

      if (!Array.isArray(reviews) || reviews.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="5" class="text-center text-gray-500 p-4">
            Geen gemelde reviews gevonden.
          </td></tr>`;
        return;
      }

      const rows = reviews.map((rev) => {
        const datum = rev.createdAt
          ? new Date(rev.createdAt).toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "-";

        return `
          <tr class="border-t hover:bg-indigo-50 transition">
            <td class="p-3">${rev.name || "-"}</td>
            <td class="p-3">${"⭐".repeat(rev.rating || 0)}</td>
            <td class="p-3">${rev.message || "-"}</td>
            <td class="p-3">${datum}</td>
            <td class="p-3 text-center space-x-2">
              <button data-id="${rev._id}" data-action="approve"
                class="bg-green-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-green-700 transition">
                Toestaan
              </button>
              <button data-id="${rev._id}" data-action="remove"
                class="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition">
                Verwijderen
              </button>
            </td>
          </tr>`;
      }).join("");

      tbody.innerHTML = rows;
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      tbody.innerHTML = `
        <tr><td colspan="5" class="text-center text-red-600 p-4">
          Fout bij laden reviews.
        </td></tr>`;
    }
  }

  // 🔹 Acties voor knoppen (approve/remove)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const action = btn.getAttribute("data-action");

    try {
      const res = await fetch(`${backendUrl}/api/admin/reviews/${id}/${action}`, {
        method: "PUT",
      });

      if (!res.ok) throw new Error(`Fout bij ${action} (${res.status})`);
      console.log(`✅ Review ${action} uitgevoerd voor ID ${id}`);
      await loadReportedReviews();
    } catch (err) {
      console.error("❌ Fout bij uitvoeren actie:", err);
    }
  });

  // 🔹 Initialisatie
  loadReportedReviews();
});
