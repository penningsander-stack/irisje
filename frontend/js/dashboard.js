// frontend/js/dashboard.js

const API_BASE = "https://irisje-backend.onrender.com/api";

// 🟢 Helper om het ingelogde bedrijf te bepalen
function getCompanyId() {
  return localStorage.getItem("companyId") || ""; // wordt tijdens login ingesteld
}

// 🟢 Formatteer datum naar NL
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// 🟢 Aanvragen laden
async function loadRequests() {
  const tableBody = document.getElementById("request-table-body");
  const filter = document.getElementById("filterStatus").value;
  const companyId = getCompanyId();
  if (!companyId) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 p-4">Geen bedrijf gevonden (log opnieuw in).</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/publicRequests`);
    if (!res.ok) throw new Error("Kon aanvragen niet laden.");
    const data = await res.json();

    // Filter alleen aanvragen van dit bedrijf
    const filtered = data.filter((r) => r.company === companyId);
    const statusFiltered =
      filter === "alle" ? filtered : filtered.filter((r) => r.status === filter);

    if (statusFiltered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">Geen aanvragen gevonden.</td></tr>`;
      updateStats(filtered);
      return;
    }

    tableBody.innerHTML = statusFiltered
      .map(
        (req) => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="p-2">${req.name}</td>
          <td class="p-2">${req.email}</td>
          <td class="p-2">${req.message}</td>
          <td class="p-2">${req.status || "Nieuw"}</td>
          <td class="p-2">${formatDate(req.createdAt)}</td>
        </tr>`
      )
      .join("");

    updateStats(filtered);
  } catch (err) {
    console.error("Fout bij laden aanvragen:", err);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-red-500 p-4">Fout bij laden aanvragen.</td></tr>`;
  }
}

// 🟢 Statistieken bijwerken
function updateStats(requests) {
  document.getElementById("total").textContent = requests.length;
  document.getElementById("accepted").textContent = requests.filter(r => r.status === "Geaccepteerd").length;
  document.getElementById("rejected").textContent = requests.filter(r => r.status === "Afgewezen").length;
  document.getElementById("followed-up").textContent = requests.filter(r => r.status === "Opgevolgd").length;
}

// 🟢 Reviews laden
async function loadReviews() {
  const tableBody = document.getElementById("review-table-body");
  const companyId = getCompanyId();
  if (!companyId) {
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 p-4">Geen bedrijf gevonden.</td></tr>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error("Kon reviews niet laden.");
    const data = await res.json();

    const filtered = data.filter((r) => r.company === companyId);

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 p-4">Nog geen reviews.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered
      .map(
        (rev) => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
          <td class="p-2">${rev.name}</td>
          <td class="p-2 text-yellow-500">${"⭐".repeat(rev.rating || 0)}</td>
          <td class="p-2">${rev.message}</td>
          <td class="p-2">${formatDate(rev.createdAt || rev.date)}</td>
        </tr>`
      )
      .join("");
  } catch (err) {
    console.error("Fout bij laden reviews:", err);
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500 p-4">Fout bij laden reviews.</td></tr>`;
  }
}

// 🟢 Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

// 🟢 Event: filter wijzigen
document.getElementById("filterStatus").addEventListener("change", loadRequests);

// 🟢 Init
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("userEmail");
  document.getElementById("company-name").textContent = email || "Bedrijf";
  document.getElementById("last-login").textContent = new Date().toLocaleString("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  loadRequests();
  loadReviews();
});
