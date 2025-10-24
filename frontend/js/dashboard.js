// frontend/js/dashboard.js
const backendUrl = "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const requestTable = document.querySelector("#request-table-body");
  const reviewTable = document.querySelector("#review-table-body");
  const totalEl = document.querySelector("#total");
  const acceptedEl = document.querySelector("#accepted");
  const rejectedEl = document.querySelector("#rejected");
  const followedUpEl = document.querySelector("#followed-up");

  const userEmail = localStorage.getItem("userEmail"); // opgeslagen bij login

  async function loadRequests() {
    try {
      if (!userEmail) throw new Error("Geen e-mailadres gevonden in localStorage");

      const res = await fetch(`${backendUrl}/api/requests?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("Serverfout bij aanvragen");
      const data = await res.json();

      requestTable.innerHTML = "";
      if (!data.length) {
        requestTable.innerHTML = `
          <tr><td colspan="5" class="text-center text-gray-500 p-4">
            Geen aanvragen gevonden.
          </td></tr>`;
        updateStats([]);
        return;
      }

      data.forEach((req) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="border p-2">${req.name}</td>
          <td class="border p-2">${req.email}</td>
          <td class="border p-2">${req.message}</td>
          <td class="border p-2">${req.status}</td>
          <td class="border p-2">${new Date(req.createdAt).toLocaleDateString("nl-NL")}</td>
        `;
        requestTable.appendChild(row);
      });

      updateStats(data);
    } catch (err) {
      console.error("❌ Fout bij laden aanvragen:", err);
      requestTable.innerHTML = `
        <tr><td colspan="5" class="text-center text-red-600 p-4">
          Fout bij laden aanvragen.
        </td></tr>`;
    }
  }

  function updateStats(requests) {
    totalEl.textContent = requests.length;
    acceptedEl.textContent = requests.filter(r => r.status === "Geaccepteerd").length;
    rejectedEl.textContent = requests.filter(r => r.status === "Afgewezen").length;
    followedUpEl.textContent = requests.filter(r => r.status === "Opgevolgd").length;
  }

  async function loadReviews() {
    try {
      const res = await fetch(`${backendUrl}/api/reviews`);
      const reviews = await res.json();

      reviewTable.innerHTML = "";
      if (!reviews.length) {
        reviewTable.innerHTML = `
          <tr><td colspan="4" class="text-center text-gray-500 p-4">
            Geen reviews gevonden.
          </td></tr>`;
        return;
      }

      reviews.forEach((rev) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td class="border p-2">${rev.name}</td>
          <td class="border p-2">${"⭐".repeat(rev.rating || 0)}</td>
          <td class="border p-2">${rev.message}</td>
          <td class="border p-2">${new Date(rev.createdAt || rev.date).toLocaleDateString("nl-NL")}</td>
        `;
        reviewTable.appendChild(row);
      });
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
    }
  }

  loadRequests();
  loadReviews();
});
