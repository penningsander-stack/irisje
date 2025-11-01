// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  const $tableBody = document.querySelector("#reportedReviewsBody");

  if (!$tableBody) return;

  // ===========================
  // 💬 GEMELDE REVIEWS LADEN
  // ===========================
  async function loadReportedReviews() {
    try {
      const res = await fetch(`${API_BASE}/admin/reported`);
      if (!res.ok) throw new Error(`Server antwoordde met ${res.status}`);

      const reviews = await res.json();
      $tableBody.innerHTML = "";

      if (!Array.isArray(reviews) || !reviews.length) {
        $tableBody.innerHTML = `
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
        row.className = "border-t hover:bg-indigo-50 transition";

        row.innerHTML = `
          <td class="p-3">${esc(rev.name) || "-"}</td>
          <td class="p-3">${"⭐".repeat(rev.rating || 0)}</td>
          <td class="p-3 max-w-xs truncate">${esc(rev.message) || "-"}</td>
          <td class="p-3">${datum}</td>
          <td class="p-3 text-center">
            <button data-id="${rev._id}"
              class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1">
              Afgehandeld
            </button>
          </td>`;
        $tableBody.appendChild(row);
      });
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      $tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-red-600 p-4">
            ❌ Fout bij laden reviews.
          </td>
        </tr>`;
    }
  }

  // ===============================
  // ✅ REVIEW AFHANDELEN (UNREPORT)
  // ===============================
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

      showToast("✅ Review succesvol afgehandeld!", "success");
      await loadReportedReviews();
    } catch (err) {
      console.error("❌ Fout bij afhandelen review:", err);
      showToast("❌ Er is iets misgegaan bij het afhandelen.", "error");
      btn.disabled = false;
      btn.textContent = "Afgehandeld";
    }
  });

  // ===========================
  // 🪄 MINI TOAST-MELDING
  // ===========================
  function showToast(msg, type = "info") {
    const toast = document.createElement("div");
    const color =
      type === "success"
        ? "bg-green-600"
        : type === "error"
        ? "bg-red-600"
        : "bg-indigo-600";
    toast.className = `${color} text-white fixed bottom-6 right-6 px-4 py-2 rounded-lg shadow-md text-sm animate-fade-in-up`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // ===========================
  // 🔒 ESCAPE FUNCTIE
  // ===========================
  function esc(v) {
    if (v == null) return "";
    return String(v).replace(/[&<>"']/g, (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s])
    );
  }

  // ===========================
  // 🚀 INIT
  // ===========================
  loadReportedReviews();
});
