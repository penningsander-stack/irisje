// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const tbody = document.getElementById("requestsBody");

  async function loadRequests() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/requests/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      tbody.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="padding:0.75rem;">Geen aanvragen gevonden.</td></tr>`;
        return;
      }

      data.forEach((req) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td style="padding:0.5rem;">${req.name}</td>
          <td style="padding:0.5rem;">${req.email}</td>
          <td style="padding:0.5rem;">${req.message}</td>
          <td style="padding:0.5rem;">${req.status}</td>
          <td style="padding:0.5rem;">${new Date(req.date).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
      });

      updateStats(data);
    } catch (err) {
      console.error("Fout bij ophalen aanvragen:", err);
      tbody.innerHTML = `<tr><td colspan="5" style="padding:0.75rem;">Serverfout bij laden aanvragen.</td></tr>`;
    }
  }

  function updateStats(data) {
    document.getElementById("totalRequests").textContent = data.length;
    document.getElementById("acceptedCount").textContent = data.filter((r) => r.status === "Geaccepteerd").length;
    document.getElementById("rejectedCount").textContent = data.filter((r) => r.status === "Afgewezen").length;
    document.getElementById("followedUpCount").textContent = data.filter((r) => r.status === "Opgevolgd").length;
  }

  loadRequests();
});
