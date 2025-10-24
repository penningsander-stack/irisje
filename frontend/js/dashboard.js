document.addEventListener("DOMContentLoaded", async () => {
  const apiBase = "https://irisje-backend.onrender.com";
  const stats = {
    total: document.getElementById("stat-total"),
    accepted: document.getElementById("stat-accepted"),
    rejected: document.getElementById("stat-rejected"),
    followed: document.getElementById("stat-followed")
  };
  const listContainer = document.getElementById("requests-list");
  const filterSelect = document.getElementById("status-filter");

  async function loadRequests() {
    try {
      const res = await axios.get(`${apiBase}/api/requests/my`, { withCredentials: true });
      const requests = res.data || [];
      renderStats(requests);
      renderRequests(requests);
    } catch (err) {
      console.error(err);
      listContainer.innerHTML = "<p class='text-red-600'>Kon aanvragen niet laden.</p>";
    }
  }

  function renderStats(reqs) {
    stats.total.textContent = reqs.length;
    stats.accepted.textContent = reqs.filter(r => r.status === "Geaccepteerd").length;
    stats.rejected.textContent = reqs.filter(r => r.status === "Afgewezen").length;
    stats.followed.textContent = reqs.filter(r => r.status === "Opgevolgd").length;
  }

  function renderRequests(reqs) {
    const filter = filterSelect.value;
    const filtered = filter === "Alle" ? reqs : reqs.filter(r => r.status === filter);
    listContainer.innerHTML = "";
    if (!filtered.length) {
      listContainer.innerHTML = "<p class='text-gray-500'>Geen aanvragen gevonden.</p>";
      return;
    }
    filtered.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="border px-2 py-1">${r.name}</td>
        <td class="border px-2 py-1">${r.email}</td>
        <td class="border px-2 py-1">${r.message}</td>
        <td class="border px-2 py-1">${r.status}</td>
        <td class="border px-2 py-1">${new Date(r.date).toLocaleDateString("nl-NL")}</td>
      `;
      listContainer.appendChild(row);
    });
  }

  filterSelect.addEventListener("change", loadRequests);
  await loadRequests();
});
