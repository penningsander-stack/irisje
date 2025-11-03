// frontend/js/admin.js
const API_BASE = "https://irisje-backend.onrender.com/api";
const ENDPOINT_GET_REPORTED = `${API_BASE}/admin/reported`;
const ENDPOINT_RESOLVE_REPORTED = (id) => `${API_BASE}/admin/resolve/${id}`;

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  const tableBody = document.getElementById("reported-table-body");
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadReportedReviews);
  }

  await loadReportedReviews();

  async function loadReportedReviews() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Gemelde reviews worden geladen...
          </td>
        </tr>`;
    }

    try {
      const res = await fetch(ENDPOINT_GET_REPORTED);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Ongeldig antwoord van de server.");
      }

      renderTable(data);
      updateStats(data);
    } catch (err) {
      console.error("Fout bij laden gemelde reviews:", err);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-red-600 p-4">
              ❌ Kon gemelde reviews niet laden.
            </td>
          </tr>`;
      }
      updateStats([]);
    }
  }

  function renderTable(list) {
    if (!tableBody) return;

    if (!list.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Geen gemelde reviews gevonden.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = list
      .map((r) => {
        const id = r._id || r.id;
        const companyName = r.company?.name || r.companyName || "Onbekend";
        const reviewer = r.reviewerName || r.name || "Onbekend";
        const rating = r.rating ? "⭐".repeat(r.rating) : "-";
        const msg = esc(r.message || "");
        const d = formatDate(r.createdAt || r.date);
        const resolved = !r.reported;

        return `
        <tr class="border-b border-gray-50 hover:bg-gray-50" data-id="${id}">
          <td class="p-3">${esc(companyName)}</td>
          <td class="p-3">${esc(reviewer)}</td>
          <td class="p-3">${rating}</td>
          <td class="p-3 max-w-xs truncate" title="${msg}">${msg}</td>
          <td class="p-3 whitespace-nowrap">${d}</td>
          <td class="p-3">
            <span class="px-2 py-1 rounded text-xs font-medium ${
              resolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }">${resolved ? "Afgehandeld" : "In behandeling"}</span>
          </td>
          <td class="p-3">
            ${
              resolved
                ? `<span class="text-xs text-gray-400">✔ Gereed</span>`
                : `<button class="mark-done bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition" data-id="${id}">
                    Markeer als afgehandeld
                  </button>`
            }
          </td>
        </tr>`;
      })
      .join("");

    tableBody.querySelectorAll(".mark-done").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        await markAsResolved(id);
      });
    });
  }

  async function markAsResolved(id) {
    if (!confirm("Weet je zeker dat je deze melding wilt afhandelen?")) return;
    try {
      const res = await fetch(ENDPOINT_RESOLVE_REPORTED(id), { method: "PATCH" });
      if (!res.ok) throw new Error("Serverfout");
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        row.classList.add("fade-row-out");
        setTimeout(() => {
          row.remove();
          loadReportedReviews();
        }, 450);
      } else {
        loadReportedReviews();
      }
    } catch (err) {
      console.error(err);
      alert("❌ Er ging iets mis bij het afhandelen van deze review.");
    }
  }

  function updateStats(list) {
    const totalEl = document.getElementById("total-reported");
    const openEl = document.getElementById("open-reported");
    const resolvedEl = document.getElementById("resolved-reported");

    const total = list.length;
    const resolved = list.filter((r) => !r.reported).length;
    const open = total - resolved;

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (resolvedEl) resolvedEl.textContent = resolved;
  }
}

function esc(v) {
  return v == null ? "" : String(v).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

function formatDate(v) {
  const d = new Date(v);
  return isNaN(d) ? "-" : d.toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
}
