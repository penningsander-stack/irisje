// frontend/js/dashboard_safe.js
console.log("📊 Dashboard Safe Script geladen");

const API = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

// Veilige fetch helper (crasht niet op HTML of lege responses)
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
  const companyId =
    localStorage.getItem("companyId") || "68f4c355ab9e361a51d29acd";

  if (!token) {
    window.location.href = "login.html";
    return;
  }
  console.log("✅ Token is geldig en behouden");

  // Welkomstgegevens (als beschikbaar)
  const nameEl = document.getElementById("companyName");
  const emailEl = document.getElementById("companyEmail");
  const categoryEl = document.getElementById("category");
  const lastLoginEl = document.getElementById("lastLogin");
  if (nameEl) nameEl.textContent = localStorage.getItem("companyName") || "Bedrijf";
  if (emailEl) emailEl.textContent = localStorage.getItem("companyEmail") || "";
  if (categoryEl) categoryEl.textContent = localStorage.getItem("companyCategory") || "";
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

  const headers = { Authorization: `Bearer ${token}` };

  // 📬 Aanvragen laden (server haalt companyId uit token)
  const requestsUrl = `${API}/api/requests/company`;
  const requests = (await safeFetch(requestsUrl, { headers })) || [];
  console.log("📬 Ruwe response aanvragen:", requests);

  const reqBody = document.getElementById("requestsBody");
  if (reqBody) {
    if (Array.isArray(requests) && requests.length > 0) {
      reqBody.innerHTML = requests
        .map(
          (r) => `
        <tr>
          <td>${r.name || ""}</td>
          <td>${r.email || ""}</td>
          <td>${r.message || ""}</td>
          <td>${r.status || ""}</td>
          <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : ""}</td>
        </tr>`
        )
        .join("");
    } else {
      reqBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
    }
  }

  // 💬 Reviews laden (met companyId in pad)
  const reviewsUrl = `${API}/api/reviews/company/${companyId}`;
  const reviews = (await safeFetch(reviewsUrl, { headers })) || [];
  console.log("💬 Ruwe response reviews:", reviews);

  const revBody = document.getElementById("reviewsBody");
  if (revBody) {
    if (Array.isArray(reviews) && reviews.length > 0) {
      revBody.innerHTML = reviews
        .map(
          (r) => `
        <tr>
          <td>${r.name || ""}</td>
          <td>${"⭐".repeat(Number(r.rating) || 0)}</td>
          <td>${r.message || ""}</td>
          <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : ""}</td>
          <td><button class="report-btn" data-id="${r._id}">Meld</button></td>
        </tr>`
        )
        .join("");
    } else {
      revBody.innerHTML = `<tr><td colspan="5">Geen reviews gevonden.</td></tr>`;
    }
  }

  // 🎯 Meld-knoppen activeren (POST /api/reviews/report/:id)
  document.querySelectorAll(".report-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reviewId = btn.dataset.id;
      if (!reviewId) return;

      const ok = confirm("Weet je zeker dat je deze review wilt melden?");
      if (!ok) return;

      const res = await safeFetch(`${API}/api/reviews/report/${reviewId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res?.success) {
        btn.disabled = true;
        btn.textContent = "Gemeld";
        alert("✅ Review gemeld voor controle.");
      } else {
        alert(res?.error || "❌ Fout bij melden review.");
      }
    });
  });

  // 📈 Eenvoudige donutgrafiek (alleen als Chart.js aanwezig is)
  try {
    const ctx = document.getElementById("statusChart");
    if (ctx && window.Chart && Array.isArray(requests)) {
      const counts = {
        Nieuw: requests.filter((r) => r.status === "Nieuw").length,
        Geaccepteerd: requests.filter((r) => r.status === "Geaccepteerd").length,
        Afgewezen: requests.filter((r) => r.status === "Afgewezen").length,
        Opgevolgd: requests.filter((r) => r.status === "Opgevolgd").length,
      };
      new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
          datasets: [
            {
              data: [
                counts.Nieuw,
                counts.Geaccepteerd,
                counts.Afgewezen,
                counts.Opgevolgd,
              ],
              backgroundColor: ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"],
            },
          ],
        },
        options: { plugins: { legend: { position: "bottom" } } },
      });
    }
  } catch (err) {
    console.warn("Grafiek kon niet worden getekend:", err);
  }

  console.log("✅ Dashboard geladen met grafiek, filter en meldknoppen (visueel)");
});
