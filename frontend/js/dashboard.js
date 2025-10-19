// frontend/js/dashboard.js
const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const logoutBtn = document.getElementById("logout");
  const filterSelect = document.getElementById("filter");
  const requestsTable = document.querySelector("#requests-table tbody");
  const reviewsTable = document.querySelector("#reviews-table tbody");
  const companyNameEl = document.querySelector("[data-company-name]");
  const companyEmailEl = document.querySelector("[data-company-email]");
  const companyCategoryEl = document.querySelector("[data-company-category]");
  const lastLoginEl = document.getElementById("last-login");

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("companyId");
    window.location.href = "login.html";
  });

  try {
    // 1️⃣ Bedrijfsinfo ophalen
    const resCompany = await fetch(`${API_BASE}/api/secure/company`, { headers });
    const company = await resCompany.json();
    if (!company?._id) throw new Error("Geen bedrijf gevonden");

    localStorage.setItem("companyId", company._id);

    companyNameEl.textContent = company.name || "Onbekend bedrijf";
    companyEmailEl.textContent = company.email || "";
    companyCategoryEl.textContent = company.category || "";
    lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

    // 2️⃣ Aanvragen ophalen
    const loadRequests = async (status = "Alle") => {
      try {
        let url = `${API_BASE}/api/requests/company/${company._id}`;
        if (status !== "Alle") url += `?status=${encodeURIComponent(status)}`;
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          requestsTable.innerHTML = `<tr><td colspan="6">Geen aanvragen gevonden.</td></tr>`;
          return;
        }

        requestsTable.innerHTML = data
          .map(
            (r) => `
              <tr>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>${r.message}</td>
                <td>${r.status}</td>
                <td>${new Date(r.createdAt).toLocaleDateString("nl-NL")}</td>
                <td>
                  <button class="status-btn" data-id="${r._id}" data-status="Geaccepteerd">✅</button>
                  <button class="status-btn" data-id="${r._id}" data-status="Afgewezen">❌</button>
                </td>
              </tr>
            `
          )
          .join("");
      } catch (err) {
        console.error("Fout bij aanvragen laden:", err);
        requestsTable.innerHTML = `<tr><td colspan="6">Serverfout bij laden aanvragen.</td></tr>`;
      }
    };

    await loadRequests();

    // Filterknop
    filterSelect.addEventListener("change", (e) => loadRequests(e.target.value));

    // 3️⃣ Reviews ophalen
    try {
      const res = await fetch(`${API_BASE}/api/reviews/company/${company._id}`, { headers });
      const reviews = await res.json();

      if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewsTable.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
      } else {
        reviewsTable.innerHTML = reviews
          .map(
            (rev) => `
              <tr>
                <td>${rev.name}</td>
                <td>${"⭐".repeat(rev.rating)}</td>
                <td>${rev.message}</td>
                <td>${new Date(rev.createdAt).toLocaleDateString("nl-NL")}</td>
                <td><button class="status-btn muted" disabled>👁️</button></td>
              </tr>
            `
          )
          .join("");
      }
    } catch (err) {
      console.error("Fout bij reviews laden:", err);
      reviewsTable.innerHTML = `<tr><td colspan="5">Serverfout bij laden reviews.</td></tr>`;
    }

    // 4️⃣ Statistieken (Chart.js)
    try {
      const res = await fetch(`${API_BASE}/api/requests/company/${company._id}`, { headers });
      const data = await res.json();
      const counts = { Nieuw: 0, Geaccepteerd: 0, Afgewezen: 0, Opgevolgd: 0 };
      data.forEach((r) => {
        if (counts[r.status] !== undefined) counts[r.status]++;
      });

      const ctx = document.getElementById("statusChart").getContext("2d");
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: Object.keys(counts),
          datasets: [
            {
              data: Object.values(counts),
              backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"],
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: "bottom" },
          },
        },
      });
    } catch (err) {
      console.error("Fout bij grafiek laden:", err);
    }
  } catch (err) {
    console.error("Dashboard-fout:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});
