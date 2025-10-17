// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const company = JSON.parse(localStorage.getItem("company"));
  document.getElementById("companyName").textContent = company.name;
  document.getElementById("companyEmail").textContent = company.email;
  document.getElementById("companyCategory").textContent = company.category;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  const tbody = document.getElementById("requestsBody");
  const filterSelect = document.getElementById("filterStatus");
  const searchInput = document.getElementById("searchInput");

  let requestsData = [];

  async function loadDashboard() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/dashboard/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fout bij laden dashboard");

      requestsData = data.requests;
      updateStats(data);
      renderTable();
    } catch (err) {
      console.error("Dashboard-fout:", err);
      tbody.innerHTML = `<tr><td colspan="5">Serverfout bij laden dashboard.</td></tr>`;
    }
  }

  function updateStats(data) {
    document.getElementById("statTotal").textContent = data.total;
    document.getElementById("statAccepted").textContent = data.accepted;
    document.getElementById("statRejected").textContent = data.rejected;
    document.getElementById("statFollowed").textContent = data.followed;
  }

  function renderTable() {
    const filter = filterSelect.value;
    const search = searchInput.value.toLowerCase();
    tbody.innerHTML = "";

    const filtered = requestsData.filter((r) => {
      const matchStatus = filter === "Alle" || r.status === filter;
      const matchSearch =
        r.name.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    });

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="5">Geen resultaten gevonden.</td></tr>`;
      return;
    }

    filtered.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.message}</td>
        <td>
          <select data-id="${r._id}">
            <option ${r.status === "Nieuw" ? "selected" : ""}>Nieuw</option>
            <option ${r.status === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
            <option ${r.status === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
            <option ${r.status === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
          </select>
        </td>
        <td>${new Date(r.date).toLocaleDateString()}</td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll("select[data-id]").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        const id = e.target.dataset.id;
        const status = e.target.value;
        await fetch(`${window.ENV.API_BASE}/api/dashboard/status/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        });
        loadDashboard();
      });
    });
  }

  filterSelect.addEventListener("change", renderTable);
  searchInput.addEventListener("input", renderTable);

  await loadDashboard();
});
