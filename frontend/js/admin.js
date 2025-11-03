const API_BASE = "https://irisje-backend.onrender.com/api"; // zelfde als dashboard.js

document.addEventListener("DOMContentLoaded", initAdmin);

async function initAdmin() {
  const tableBody = document.getElementById("reported-table-body");
  const refreshBtn = document.getElementById("refreshBtn");

  // logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("companyId");
      window.location.href = "login.html";
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadReportedReviews();
    });
  }

  // meteen laden
  await loadReportedReviews();

  async function loadReportedReviews() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Gemelde reviews worden geladen...
          </td>
        </tr>
      `;
    }

    try {
      // LET OP:
      // hieronder ga ik uit van een endpoint in jouw backend dat
      // alle gemelde reviews teruggeeft.
      // Als jouw backend een andere route heeft, pas dan alleen deze regel aan:
      const res = await fetch(`${API_BASE}/admin/reported-reviews`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Ongeldig antwoord van de server.");
      }

      renderReportedTable(data);
      updateStats(data);
    } catch (err) {
      console.error("Fout bij laden gemelde reviews:", err);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-red-600 p-4">
              ❌ Kon gemelde reviews niet laden.
            </td>
          </tr>
        `;
      }
      updateStats([]);
    }
  }

  function renderReportedTable(list) {
    if (!tableBody) return;

    if (!list.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray-400 p-4">
            Geen gemelde reviews gevonden.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list
      .map((item) => {
        const id = item._id || item.id;
        const companyName = item.companyName || (item.company && item.company.name) || "Onbekend";
        const reviewerName = item.reviewerName || item.name || "Onbekend";
        const rating = item.rating ? "⭐".repeat(item.rating) : "-";
        const message = esc(item.message || item.reviewText || "");
        const status = item.status || item.reportStatus || "in behandeling";
        const created = formatDate(item.createdAt || item.date);

        const isResolved = status.toLowerCase() === "afgehandeld" || status.toLowerCase() === "resolved";

        return `
          <tr class="border-b border-gray-50 hover:bg-gray-50" data-id="${id}">
            <td class="p-3">${esc(companyName)}</td>
            <td class="p-3">${esc(reviewerName)}</td>
            <td class="p-3">${rating}</td>
            <td class="p-3 max-w-xs truncate" title="${message}">${message}</td>
            <td class="p-3 whitespace-nowrap">${created}</td>
            <td class="p-3">
              <span class="px-2 py-1 rounded text-xs font-medium ${
                isResolved
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }">
                ${isResolved ? "Afgehandeld" : "In behandeling"}
              </span>
            </td>
            <td class="p-3">
              ${
                isResolved
                  ? `<span class="text-xs text-gray-400">✔ Gereed</span>`
                  : `<button
                      class="mark-done bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition"
                      data-id="${id}"
                    >
                      Markeer als afgehandeld
                    </button>`
              }
            </td>
          </tr>
        `;
      })
      .join("");

    // knoppen activeren
    const buttons = tableBody.querySelectorAll(".mark-done");
    buttons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (!id) return;
        await markAsResolved(id);
      });
    });
  }

  async function markAsResolved(id) {
    // kleine confirm
    const ok = confirm("Weet je zeker dat je deze melding als afgehandeld wilt markeren?");
    if (!ok) return;

    try {
      // zelfde opmerking als boven: route kan anders heten in jouw backend
      const res = await fetch(`${API_BASE}/admin/reported-reviews/${id}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Server gaf een fout terug");
      }

      // visuele feedback: rij laten vervagen
      const row = document.querySelector(`tr[data-id="${id}"]`);
      if (row) {
        row.classList.add("fade-row-out");
        setTimeout(() => {
          row.remove();
          // na verwijderen opnieuw stats bijwerken
          const remainingRows = Array.from(
            document.querySelectorAll("#reported-table-body tr[data-id]")
          ).map((tr) => tr.dataset.id);
          // als er niks meer is: melding
          if (!remainingRows.length && tableBody) {
            tableBody.innerHTML = `
              <tr>
                <td colspan="7" class="text-center text-gray-400 p-4">
                  Geen gemelde reviews gevonden.
                </td>
              </tr>
            `;
          }
          // of alles opnieuw laden als je zeker wilt zijn:
          loadReportedReviews();
        }, 450);
      } else {
        // fallback: gewoon herladen
        loadReportedReviews();
      }
    } catch (err) {
      console.error("Fout bij afhandelen:", err);
      alert("❌ Er ging iets mis bij het afhandelen van deze review.");
    }
  }

  function updateStats(list) {
    const totalEl = document.getElementById("total-reported");
    const openEl = document.getElementById("open-reported");
    const resolvedEl = document.getElementById("resolved-reported");

    const total = list.length;
    const resolved = list.filter((i) => {
      const s = (i.status || i.reportStatus || "").toLowerCase();
      return s === "afgehandeld" || s === "resolved";
    }).length;
    const open = total - resolved;

    if (totalEl) totalEl.textContent = total;
    if (openEl) openEl.textContent = open;
    if (resolvedEl) resolvedEl.textContent = resolved;
  }
}

// helpers
function esc(v) {
  if (v == null) return "";
  return String(v).replace(/[&<>"']/g, (s) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s];
  });
}

function formatDate(v) {
  const d = new Date(v);
  if (!v || isNaN(d)) return "-";
  return d.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
