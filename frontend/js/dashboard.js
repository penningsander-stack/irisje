// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const api = (window.ENV && window.ENV.API_BASE) || "";
  const logoutBtn = document.getElementById("logoutBtn");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  try {
    const res = await fetch(`${api}/api/dashboard/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Fout bij laden dashboardgegevens");
    const data = await res.json();

    document.getElementById("stat-total").textContent = data.total || 0;
    document.getElementById("stat-accepted").textContent = data.accepted || 0;
    document.getElementById("stat-rejected").textContent = data.rejected || 0;
    document.getElementById("stat-followed").textContent = data.followed || 0;

    const tbody = document.getElementById("requestsBody");
    tbody.innerHTML = "";

    if (data.requests && data.requests.length > 0) {
      for (const r of data.requests) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.name}</td>
          <td>${r.email}</td>
          <td>${r.message}</td>
          <td>${r.status}</td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        `;
        tbody.appendChild(tr);
      }
    } else {
      tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }

    document.getElementById("statusFilter").addEventListener("change", (e) => {
      const val = e.target.value;
      const rows = tbody.querySelectorAll("tr");
      rows.forEach((row) => {
        const status = row.children[3]?.textContent || "";
        row.style.display = !val || status === val ? "" : "none";
      });
    });
  } catch (err) {
    console.error("Dashboard-fout:", err);
  }
});
