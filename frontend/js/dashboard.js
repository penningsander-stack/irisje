// frontend/js/dashboard.js
const API = window.ENV.API_BASE;
const token = localStorage.getItem("token");

document.getElementById("logout").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "login.html";
});

const tableBody = document.querySelector("#requests-table tbody");
const filter = document.getElementById("filter");

async function loadDashboard() {
  try {
    const res = await fetch(`${API}/api/companies/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || "Serverfout bij laden dashboard");

    // Statistieken
    document.getElementById("total").textContent = data.stats.total;
    document.getElementById("accepted").textContent = data.stats.accepted;
    document.getElementById("rejected").textContent = data.stats.rejected;
    document.getElementById("followed").textContent = data.stats.followed;

    renderRequests(data.requests);
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
  }
}

function renderRequests(requests) {
  const selected = filter.value;
  const filtered =
    selected === "Alle"
      ? requests
      : requests.filter((r) => r.status === selected);

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";
  filtered.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.name}</td>
      <td>${r.email}</td>
      <td>${r.message}</td>
      <td>${r.status}</td>
      <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
      <td>
        <button class="status-btn" data-id="${r._id}" data-status="Geaccepteerd">✅</button>
        <button class="status-btn" data-id="${r._id}" data-status="Afgewezen">❌</button>
        <button class="status-btn" data-id="${r._id}" data-status="Opgevolgd">🔄</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".status-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const status = btn.dataset.status;
      await updateStatus(id, status);
    });
  });
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API}/api/requests/status/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (data.success) loadDashboard();
  } catch (err) {
    console.error("Status-update mislukt:", err);
  }
}

filter.addEventListener("change", loadDashboard);
loadDashboard();
