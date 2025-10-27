// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole") || "company";

  let companyId = localStorage.getItem("companyId");

  // 🟣 Beheerder: bedrijven ophalen via owner
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

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    document.getElementById("review-table-body").innerHTML =
      "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden.</td></tr>";
    return;
  }

  // === Aanvragen laden ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/requests`, {
  credentials: "include",
});

      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("request-table-body").innerHTML =
          "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
        return;
      }

      const rows = data.map((req) => {
        const d = new Date(req.createdAt).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return (
          "<tr class='border-t'>" +
          "<td>" + (req.name || "") + "</td>" +
          "<td>" + (req.email || "") + "</td>" +
          "<td>" + (req.message || "") + "</td>" +
          "<td>" + (req.status || "Nieuw") + "</td>" +
          "<td>" + d + "</td>" +
          "</tr>"
        );
      }).join("");

      document.getElementById("request-table-body").innerHTML = rows;

      // Statistieken
      document.getElementById("total").textContent = data.length;
      document.getElementById("accepted").textContent = data.filter(r => r.status === "Geaccepteerd").length;
      document.getElementById("rejected").textContent = data.filter(r => r.status === "Afgewezen").length;
      document.getElementById("followed-up").textContent = data.filter(r => r.status === "Opgevolgd").length;

    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      document.getElementById("request-table-body").innerHTML =
        "<tr><td colspan='5' class='text-center text-red-600 p-4'>Fout bij laden aanvragen.</td></tr>";
    }
  }

  // === Reviews laden ===
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data) || data.length === 0) {
        document.getElementById("review-table-body").innerHTML =
          "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
        return;
      }

      const rows = data.map((rev) => {
        const d = new Date(rev.createdAt || rev.date).toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        return (
          "<tr class='border-t'>" +
          "<td>" + (rev.name || "") + "</td>" +
          "<td>" + "⭐".repeat(rev.rating || 0) + "</td>" +
          "<td>" + (rev.message || "") + "</td>" +
          "<td>" + d + "</td>" +
          "</tr>"
        );
      }).join("");

      document.getElementById("review-table-body").innerHTML = rows;
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      document.getElementById("review-table-body").innerHTML =
        "<tr><td colspan='4' class='text-center text-red-600 p-4'>Fout bij laden reviews.</td></tr>";
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
