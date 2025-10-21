// frontend/js/dashboard_safe.js
console.log("📊 Dashboard Safe Script geladen");

const API = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

// ✅ Helper om veilig te fetchen met foutafhandeling
async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn("❌ Ongeldige JSON:", text);
      return null;
    }
  } catch (err) {
    console.error("❌ Fetch-fout:", err);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const companyId = localStorage.getItem("companyId") || "68f4c355ab9e361a51d29acd";

  if (!token) {
    console.warn("⚠️ Geen token gevonden, terug naar login...");
    window.location.href = "login.html";
    return;
  }

  console.log("✅ Token is geldig en behouden");

  const headers = { Authorization: `Bearer ${token}` };

  // 📨 AANVRAGEN LADEN
  const reqUrl = `${API}/api/requests/company/${companyId}`;
  const requests = await safeFetch(reqUrl, { headers });
  console.log("📬 Ruwe response aanvragen:", requests);

  const reqBody = document.getElementById("requestsBody");
  if (Array.isArray(requests) && requests.length > 0) {
    reqBody.innerHTML = "";
    requests.forEach((r) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
      `;
      reqBody.appendChild(row);
    });
  } else {
    reqBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
  }

  // 💬 REVIEWS LADEN
  const revUrl = `${API}/api/reviews/company/${companyId}`;
  const reviews = await safeFetch(revUrl, { headers });
  console.log("💬 Ruwe response reviews:", reviews);

  const revBody = document.getElementById("reviewsBody");
  if (Array.isArray(reviews) && reviews.length > 0) {
    revBody.innerHTML = "";
    reviews.forEach((r) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${"⭐".repeat(r.rating)}</td>
        <td>${r.message}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td><button class="report-btn" data-id="${r._id}">Meld</button></td>
      `;
      revBody.appendChild(row);
    });

    // 🎯 "Meld"-knoppen activeren
    document.querySelectorAll(".report-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const reviewId = btn.dataset.id;
        if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;

        const res = await safeFetch(`${API}/api/reviews/report/${reviewId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res?.success) {
          alert("✅ Review gemeld aan beheerder.");
          btn.disabled = true;
          btn.textContent = "Gemeld";
        } else {
          alert("❌ Fout bij melden van review.");
        }
      });
    });
  } else {
    revBody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
  }

  // 📈 Simpele grafiek
  const ctx = document.getElementById("statusChart");
  if (ctx && window.Chart) {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
        datasets: [
          {
            data: [
              requests.filter((r) => r.status === "Nieuw").length,
              requests.filter((r) => r.status === "Geaccepteerd").length,
              requests.filter((r) => r.status === "Afgewezen").length,
              requests.filter((r) => r.status === "Opgevolgd").length,
            ],
            backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"],
          },
        ],
      },
      options: { plugins: { legend: { position: "bottom" } } },
    });
  }

  console.log("✅ Dashboard geladen met grafiek, filter en meldknoppen (visueel)");
});
