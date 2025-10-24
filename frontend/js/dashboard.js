// frontend/js/dashboard.js
const backendUrl = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const requestTable = document.querySelector("#request-table-body");
  const reviewTable = document.querySelector("#review-table-body");
  const totalEl = document.querySelector("#total");
  const acceptedEl = document.querySelector("#accepted");
  const rejectedEl = document.querySelector("#rejected");
  const followedUpEl = document.querySelector("#followed-up");
  const filterSelect = document.getElementById("filterStatus");

  const userEmail = localStorage.getItem("userEmail");
  const userRole = localStorage.getItem("userRole");

  // ✅ Uitloggen
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // ✅ Datum formatter
  function formatDate(d) {
    try {
      return new Date(d).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "–";
    }
  }

  // ✅ Aanvragen laden
  async function loadRequests() {
    try {
      let url;
      if (userRole === "admin") {
        url = `${backendUrl}/api/requests?email=info@irisje.nl`;
      } else if (userEmail) {
        url = `${backendUrl}/api/requests?email=${encodeURIComponent(userEmail)}`;
      } else {
        console.warn("⚠️ Geen e-mailadres in localStorage gevonden");
        return;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Fout ${res.status}`);

      renderRequests(data);
      updateStats(data);
    } catch (err) {
      console.error("❌ Fout bij laden aanvragen:", err);
      requestTable.innerHTML = `<tr><td colspan="5" class="text-center text-red-600 p-4">Fout bij laden aanvragen.</td></tr>`;
    }
  }

  // ✅ Aanvragen renderen
  function renderRequests(requests) {
    requestTable.innerHTML = "";
    if (!requests.length) {
      requestTable.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">Geen aanvragen gevonden.</td></tr>`;
      return;
    }

    const statusFilter = filterSelect.value;
    const filtered =
      statusFilter === "alle"
        ? requests
        : requests.filter((r) => r.status === statusFilter);

    filtered.forEach((req) => {
      const row = document.createElement("tr");
      row.classList.add("hover:bg-indigo-50");
      row.innerHTML = `
        <td class="border p-2">${req.name}</td>
        <td class="border p-2">${req.email}</td>
        <td class="border p-2">${req.message}</td>
        <td class="border p-2 font-semibold ${
          req.status === "Geaccepteerd"
            ? "text-green-600"
            : req.status === "Afgewezen"
            ? "text-red-600"
            : req.status === "Opgevolgd"
            ? "text-yellow-600"
            : "text-gray-700"
        }">${req.status}</td>
        <td class="border p-2">${formatDate(req.createdAt || req.date || Date.now())}</td>
      `;
      requestTable.appendChild(row);
    });

    if (!filtered.length) {
      requestTable.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 p-4">Geen aanvragen met deze status.</td></tr>`;
    }
  }

  // ✅ Statistieken bijwerken
  function updateStats(requests) {
    totalEl.textContent = requests.length;
    acceptedEl.textContent = requests.filter((r) => r.status === "Geaccepteerd").length;
    rejectedEl.textContent = requests.filter((r) => r.status === "Afgewezen").length;
    followedUpEl.textContent = requests.filter((r) => r.status === "Opgevolgd").length;
  }

  // ✅ Reviews laden
  async function loadReviews() {
    try {
      const url = `${backendUrl}/api/reviews`;
      const res = await fetch(url);
      const reviews = await res.json();

      if (!res.ok) throw new Error("Kon reviews niet laden");

      // Dubbele verwijderen (zelfde naam + bericht)
      const unique = [];
      reviews.forEach((r) => {
        if (!unique.find((u) => u.name === r.name && u.message === r.message)) {
          unique.push(r);
        }
      });

      renderReviews(unique);
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      reviewTable.innerHTML = `<tr><td colspan="4" class="text-center text-red-600 p-4">Fout bij laden reviews.</td></tr>`;
    }
  }

  // ✅ Reviews renderen
  function renderReviews(reviews) {
    reviewTable.innerHTML = "";
    if (!reviews.length) {
      reviewTable.innerHTML = `<tr><td colspan="4" class="text-center text-gray-500 p-4">Geen reviews gevonden.</td></tr>`;
      return;
    }

    reviews.forEach((rev) => {
      const row = document.createElement("tr");
      row.classList.add("hover:bg-indigo-50");
      row.innerHTML = `
        <td class="border p-2">${rev.name}</td>
        <td class="border p-2">${"⭐".repeat(rev.rating || 0)}</td>
        <td class="border p-2">${rev.message}</td>
        <td class="border p-2">${formatDate(rev.createdAt || rev.date || Date.now())}</td>
      `;
      reviewTable.appendChild(row);
    });
  }

  // Filter veranderen
  filterSelect.addEventListener("change", loadRequests);

  // Initieel laden
  loadRequests();
  loadReviews();
});
