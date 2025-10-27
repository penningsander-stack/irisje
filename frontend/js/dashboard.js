// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";

  let companyId = localStorage.getItem("companyId");

  // Beheerder-koppeling (als je inlogt als info@irisje.nl)
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();

      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
        console.log("Beheerder gekoppeld aan bedrijf:", ownerData[0].name);
      } else {
        console.warn("Geen bedrijven gevonden voor beheerder.");
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven voor beheerder:", err);
    }
  }

  // Als we écht geen companyId hebben → dashboard kan niet verder
  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    document.getElementById("review-table-body").innerHTML =
      "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
  } else {
    await initDashboard();
  }

  // Uitloggen-knop
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // ------------------------
  // Dashboard init
  // ------------------------
  async function initDashboard() {
    // laad alles 1x
    let alleAanvragen = await fetchAanvragen();
    let alleReviews = await fetchReviews(companyId);

    // render tabellen
    renderAanvragen(alleAanvragen);
    renderReviews(alleReviews);

    // statistiek-blokken
    updateStats(alleAanvragen);

    // filter dropdown gedrag
    const statusFilterEl = document.getElementById("statusFilter");
    statusFilterEl.addEventListener("change", () => {
      const waarde = statusFilterEl.value; // "" of "Nieuw" / etc.
      const gefilterd = waarde
        ? alleAanvragen.filter(a => (a.status || "Nieuw") === waarde)
        : alleAanvragen;
      renderAanvragen(gefilterd);
      updateStats(gefilterd);
    });
  }

  // ------------------------
  // API-calls
  // ------------------------
  async function fetchAanvragen() {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        return [];
      }

      // We geven de data terug zodat we 'm lokaal kunnen filteren
      return data;
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      return [];
    }
  }

  async function fetchReviews(companyId) {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        return [];
      }

      return data;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      return [];
    }
  }

  async function wijzigStatus(id, nieuweStatus) {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nieuweStatus }),
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Kon status niet updaten voor", id);
      }
    } catch (err) {
      console.error("Fout bij status bijwerken:", err);
    }
  }

  // ------------------------
  // DOM helpers
  // ------------------------
  function renderAanvragen(aanvragen) {
    const body = document.getElementById("request-table-body");

    if (!aanvragen.length) {
      body.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      return;
    }

    const rows = aanvragen.map((req) => {
      // Datum bouwen
      const d = new Date(req.date || req.createdAt);
      const datumString = isNaN(d.getTime())
        ? "-"
        : d.toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

      // Huidige status
      const huidigeStatus = req.status || "Nieuw";

      // Dropdown voor status wijzigen
      const statusDropdown = `
        <select data-id="${req._id}"
          class="border border-gray-300 rounded-lg p-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="Nieuw" ${huidigeStatus === "Nieuw" ? "selected" : ""}>Nieuw</option>
          <option value="Geaccepteerd" ${huidigeStatus === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
          <option value="Afgewezen" ${huidigeStatus === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
          <option value="Opgevolgd" ${huidigeStatus === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
        </select>
      `;

      return (
        "<tr class='border-t align-top text-sm'>" +
          `<td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(req.name || "")}</td>` +
          `<td class="px-4 py-3 text-gray-700">${escapeHTML(req.email || "")}</td>` +
          `<td class="px-4 py-3 text-gray-600 leading-relaxed max-w-xs break-words">${escapeHTML(req.message || "")}</td>` +
          `<td class="px-4 py-3 text-gray-800">${statusDropdown}</td>` +
          `<td class="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">${datumString}</td>` +
        "</tr>"
      );
    }).join("");

    body.innerHTML = rows;

    // Na renderen: luister naar alle dropdowns
    body.querySelectorAll("select[data-id]").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const aanvraagId = e.target.getAttribute("data-id");
        const nieuweStatus = e.target.value;
        await wijzigStatus(aanvraagId, nieuweStatus);
      });
    });
  }

  function renderReviews(reviews) {
    const body = document.getElementById("review-table-body");

    if (!reviews.length) {
      body.innerHTML =
        "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      return;
    }

    const rows = reviews.map((rev) => {
      const d = new Date(rev.createdAt || rev.date);
      const datumString = isNaN(d.getTime())
        ? "-"
        : d.toLocaleDateString("nl-NL", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

      return (
        "<tr class='border-t align-top text-sm'>" +
          `<td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(rev.name || "")}</td>` +
          `<td class="px-4 py-3 text-yellow-500 text-xs font-semibold leading-none">${"⭐".repeat(rev.rating || 0)}</td>` +
          `<td class="px-4 py-3 text-gray-600 leading-relaxed max-w-xs break-words">${escapeHTML(rev.message || "")}</td>` +
          `<td class="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">${datumString}</td>` +
        "</tr>"
      );
    }).join("");

    body.innerHTML = rows;
  }

  function updateStats(aanvragen) {
    document.getElementById("total").textContent = aanvragen.length;
    document.getElementById("accepted").textContent = aanvragen.filter(r => (r.status === "Geaccepteerd")).length;
    document.getElementById("rejected").textContent = aanvragen.filter(r => (r.status === "Afgewezen")).length;
    document.getElementById("followed-up").textContent = aanvragen.filter(r => (r.status === "Opgevolgd")).length;
  }

  // simpele XSS-escape om dashboard veilig te houden
  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
