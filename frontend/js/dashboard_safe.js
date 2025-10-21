// frontend/js/dashboard_safe.js
console.log("📊 Dashboard Safe Script geladen");

const API_BASE = window.ENV?.API_BASE || "https://irisje-backend.onrender.com";

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("❌ Geen token gevonden, uitloggen...");
    window.location.href = "login.html";
    return;
  }

  console.log("✅ Token is geldig en behouden");

  // --- 1️⃣ API-hulpfunctie ---
  async function safeFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    } catch (err) {
      console.error(`❌ safeFetch-fout voor ${url}:`, err);
      return [];
    }
  }

  // --- 2️⃣ Aanvragen ophalen ---
  const companyId = "68f4c355ab9e361a51d29acd"; // demo bedrijf
  const requests = await safeFetch(`${API_BASE}/api/requests/company/${companyId}`);
  console.log("📬 Ruwe response aanvragen:", requests);

  const tbodyReq = document.querySelector("#requestsBody");
  if (Array.isArray(requests) && requests.length) {
    tbodyReq.innerHTML = requests
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${r.email}</td>
        <td>${r.message}</td>
        <td>${r.status}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
      </tr>`
      )
      .join("");
  } else {
    tbodyReq.innerHTML = "<tr><td colspan='5'>Geen aanvragen gevonden.</td></tr>";
  }

  // --- 3️⃣ Reviews ophalen ---
  const reviews = await safeFetch(`${API_BASE}/api/reviews/company/${companyId}`);
  console.log("💬 Ruwe response reviews:", reviews);

  const tbodyRev = document.querySelector("#reviewsBody");
  if (Array.isArray(reviews) && reviews.length) {
    tbodyRev.innerHTML = reviews
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${"⭐".repeat(r.rating)}</td>
        <td>${r.message}</td>
        <td>${new Date(r.date).toLocaleDateString("nl-NL")}</td>
        <td><button class="report-btn" data-id="${r._id}">Meld</button></td>
      </tr>`
      )
      .join("");
  } else {
    tbodyRev.innerHTML = "<tr><td colspan='5'>Geen reviews gevonden.</td></tr>";
  }

  // --- 4️⃣ “Meld”-knoppen activeren ---
  document.querySelectorAll(".report-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Weet je zeker dat je deze review wilt melden?")) return;

      try {
        const res = await fetch(`${API_BASE}/api/reviews/report/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (data.success) {
          alert("✅ Review gemeld!");
          btn.disabled = true;
          btn.textContent = "Gemeld";
        } else {
          alert("⚠️ Fout bij melden review.");
        }
      } catch (err) {
        console.error("❌ Fout bij melden review:", err);
        alert("Serverfout bij melden review.");
      }
    });
  });

  console.log("✅ Dashboard geladen met 'Meld review'-functionaliteit");
});
