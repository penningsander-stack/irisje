// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  async function fetchDashboardData() {
    try {
      const res = await fetch(`${window.ENV.API_BASE}/api/companies/dashboard`, { headers });
      const data = await res.json();

      // Vul statistieken
      document.getElementById("totalCount").textContent = data.stats.total || 0;
      document.getElementById("acceptedCount").textContent = data.stats.accepted || 0;
      document.getElementById("rejectedCount").textContent = data.stats.rejected || 0;
      document.getElementById("followedCount").textContent = data.stats.followed || 0;

      // Pie chart
      const ctxPie = document.getElementById("pieChart").getContext("2d");
      new Chart(ctxPie, {
        type: "pie",
        data: {
          labels: ["Geaccepteerd", "Afgewezen", "Opgevolgd"],
          datasets: [
            {
              data: [
                data.stats.accepted,
                data.stats.rejected,
                data.stats.followed,
              ],
              backgroundColor: ["#22c55e", "#ef4444", "#3b82f6"],
            },
          ],
        },
      });

      // Bar chart
      const ctxBar = document.getElementById("barChart").getContext("2d");
      new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: ["Totaal", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
          datasets: [
            {
              label: "Aanvragen",
              data: [
                data.stats.total,
                data.stats.accepted,
                data.stats.rejected,
                data.stats.followed,
              ],
              backgroundColor: ["#6366f1", "#22c55e", "#ef4444", "#3b82f6"],
            },
          ],
        },
      });

      // Aanvragen tabel
      const tbody = document.getElementById("requestsBody");
      tbody.innerHTML = "";
      if (data.requests.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>Geen aanvragen gevonden.</td></tr>";
      } else {
        data.requests.forEach((req) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${req.name}</td>
            <td>${req.email}</td>
            <td>${req.message}</td>
            <td>${req.status}</td>
            <td>${new Date(req.date).toLocaleDateString()}</td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Reviews tabel
      const rBody = document.getElementById("reviewsBody");
      rBody.innerHTML = "";
      if (data.reviews.length === 0) {
        rBody.innerHTML = "<tr><td colspan='4'>Nog geen reviews.</td></tr>";
      } else {
        data.reviews.forEach((r) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${r.name}</td>
            <td>${r.rating} ⭐</td>
            <td>${r.message}</td>
            <td>${new Date(r.date).toLocaleDateString()}</td>
          `;
          rBody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error("Dashboard-fout:", err);
      document.getElementById("requestsBody").innerHTML =
        "<tr><td colspan='5'>Serverfout bij laden aanvragen.</td></tr>";
    }
  }

  await fetchDashboardData();
});
