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
          <td>
            <select class="status-select" data-id="${r._id}">
              <option ${r.status === "Nieuw" ? "selected" : ""}>Nieuw</option>
              <option ${r.status === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
              <option ${r.status === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
              <option ${r.status === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
            </select>
          </td>
          <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        `;
        tbody.appendChild(tr);
      }

      // Eventlisteners voor statuswijziging
      document.querySelectorAll(".status-select").forEach((sel) => {
        sel.addEventListener("change", async (e) => {
          const id = e.target.getAttribute("data-id");
          const status = e.target.value;
          try {
            const update = await fetch(`${api}/api/dashboard/update/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ status }),
            });
            if (update.ok) {
              console.log(`Status aanvraag ${id} gewijzigd naar ${status}`);
            }
          } catch (err) {
            console.error("Fout bij updaten status:", err);
          }
        });
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }
  } catch (err) {
    console.error("Dashboard-fout:", err);
  }
});
