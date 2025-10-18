// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const tbody = document.getElementById("requestsBody");
  const statusFilter = document.getElementById("statusFilter");

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  async function loadRequests() {
    tbody.innerHTML = `<tr><td colspan="5">Laden...</td></tr>`;
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/requests/company`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Ongeldig antwoord");

      renderRequests(data);
      updateStats(data);
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      tbody.innerHTML = `<tr><td colspan="5">Serverfout bij laden aanvragen.</td></tr>`;
    }
  }

  function renderRequests(data) {
    const filter = statusFilter.value;
    const filtered = filter === "Alle" ? data : data.filter(r => r.status === filter);

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    filtered.forEach(req => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${req.name}</td>
        <td>${req.email}</td>
        <td>${req.message}</td>
        <td>
          <select class="status-select" data-id="${req._id}">
            ${["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"]
              .map(s => `<option value="${s}" ${s === req.status ? "selected" : ""}>${s}</option>`)
              .join("")}
          </select>
        </td>
        <td>${new Date(req.date).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", async () => {
        const id = select.dataset.id;
        const status = select.value;
        await fetch(`${window.ENV.API_BASE}/api/requests/status/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });
        loadRequests();
      });
    });
  }

  function updateStats(data) {
    document.getElementById("totalRequests").textContent = data.length;
    document.getElementById("acceptedCount").textContent = data.filter(r => r.status === "Geaccepteerd").length;
    document.getElementById("rejectedCount").textContent = data.filter(r => r.status === "Afgewezen").length;
    document.getElementById("followedUpCount").textContent = data.filter(r => r.status === "Opgevolgd").length;
  }

  statusFilter.addEventListener("change", loadRequests);
  loadRequests();
});
