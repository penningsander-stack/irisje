// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";
  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder: koppel bedrijf
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();
      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven voor beheerder:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    document.getElementById("review-table-body").innerHTML =
      "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  // === Loader-element ===
  const loaderHTML = `
    <tr>
      <td colspan="5" class="text-center p-6">
        <div class="flex justify-center items-center gap-3 text-gray-500">
          <svg class="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 010 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
          </svg>
          <span>Bezig met laden...</span>
        </div>
      </td>
    </tr>`;

  // === Aanvragen laden ===
  async function loadRequests() {
    const tableBody = document.getElementById("request-table-body");
    tableBody.innerHTML = loaderHTML;

    try {
      const res = await fetch(`${API_BASE}/requests/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
        return;
      }

      const rows = data.map((req) => {
        const d = new Date(req.createdAt || req.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
          <tr class="border-t hover:bg-gray-50 transition">
            <td>${req.name || ""}</td>
            <td>${req.email || ""}</td>
            <td>${req.message || ""}</td>
            <td>${req.status || "Nieuw"}</td>
            <td>${d}</td>
          </tr>`;
      }).join("");

      tableBody.innerHTML = rows;

      // Statistieken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      tableBody.innerHTML = "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
    }
  }

  // === Reviews laden ===
  async function loadReviews() {
    const tableBody = document.getElementById("review-table-body");
    tableBody.innerHTML = loaderHTML.replace("colspan=\"5\"", "colspan=\"4\"");

    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map((rev) => {
        const d = new Date(rev.createdAt || rev.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return `
          <tr class="border-t hover:bg-gray-50 transition">
            <td>${rev.name || ""}</td>
            <td>${"⭐".repeat(rev.rating || 0)}</td>
            <td>${rev.message || ""}</td>
            <td>${d}</td>
          </tr>`;
      }).join("");

      tableBody.innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      tableBody.innerHTML = "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
    }
  }

  // === Uitloggen ===
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Init
  await loadRequests();
  await loadReviews();
});
