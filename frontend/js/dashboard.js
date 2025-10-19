// frontend/js/dashboard.js
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = (window.ENV && window.ENV.API_BASE) || "https://irisje-backend.onrender.com";
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("Geen token gevonden – terug naar login.");
    window.location.href = "login.html";
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const company = JSON.parse(localStorage.getItem("company") || "{}");

  // === DOM elementen ===
  const nameEl = document.getElementById("companyName");
  const emailEl = document.getElementById("companyEmail");
  const catEl = document.getElementById("category");
  const lastLoginEl = document.getElementById("lastLogin");
  const reqBody = document.getElementById("requestsBody");
  const revBody = document.getElementById("reviewsBody");
  const filterEl = document.getElementById("filter");

  // === Bedrijfsgegevens tonen ===
  if (nameEl) nameEl.textContent = company.name || "Demo Bedrijf";
  if (emailEl) emailEl.textContent = company.email || "demo@irisje.nl";
  if (catEl) catEl.textContent = company.category || "Algemeen";
  if (lastLoginEl) lastLoginEl.textContent = new Date().toLocaleString("nl-NL");

  // === Statistieken-elementen ===
  const statTotal = document.getElementById("statTotal");
  const statAccepted = document.getElementById("statAccepted");
  const statRejected = document.getElementById("statRejected");
  const statFollowed = document.getElementById("statFollowed");

  // === Data ophalen ===
  async function loadRequests() {
    try {
      const res = await fetch(`${API_BASE}/api/requests/company`, { headers });
      const data = await res.json();
      console.log("📬 Aanvragen:", data);

      if (!Array.isArray(data) || data.length === 0) {
        reqBody.innerHTML = `<tr><td colspan="5">Geen aanvragen gevonden.</td></tr>`;
        updateStats([]);
        return [];
      }

      renderRequests(data);
      updateStats(data);
      return data;
    } catch (err) {
      console.error("❌ Fout bij aanvragen:", err);
      reqBody.innerHTML = `<tr><td colspan="5">Serverfout bij laden aanvragen.</td></tr>`;
      updateStats([]);
      return [];
    }
  }

  function renderRequests(data) {
    reqBody.innerHTML = data
      .map(
        (r) => `
        <tr>
          <td>${r.name || "-"}</td>
          <td>${r.email || "-"}</td>
          <td>${r.message || "-"}</td>
          <td>${r.status || "Nieuw"}</td>
          <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
        </tr>`
      )
      .join("");
  }

  function updateStats(requests) {
    const total = requests.length;
    const accepted = requests.filter((r) => r.status === "Geaccepteerd").length;
    const rejected = requests.filter((r) => r.status === "Afgewezen").length;
    const followed = requests.filter((r) => r.status === "Opgevolgd").length;

    if (statTotal) statTotal.textContent = total;
    if (statAccepted) statAccepted.textContent = accepted;
    if (statRejected) statRejected.textContent = rejected;
    if (statFollowed) statFollowed.textContent = followed;
  }

  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/company`, { headers });
      const data = await res.json();
      console.log("💬 Reviews:", data);

      if (!Array.isArray(data) || data.length === 0) {
        revBody.innerHTML = `<tr><td colspan="4">Geen reviews gevonden.</td></tr>`;
        return;
      }

      revBody.innerHTML = data
        .map(
          (r) => `
          <tr>
            <td>${r.name || "-"}</td>
            <td>${"⭐".repeat(Number(r.rating) || 0)}</td>
            <td>${r.message || "-"}</td>
            <td>${r.date ? new Date(r.date).toLocaleDateString("nl-NL") : "-"}</td>
          </tr>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Fout bij laden reviews:", err);
      revBody.innerHTML = `<tr><td colspan="4">Serverfout bij laden reviews.</td></tr>`;
    }
  }

  // === Filterfunctie ===
  let allRequests = await loadRequests();
  await loadReviews();

  if (filterEl) {
    filterEl.addEventListener("change", (e) => {
      const selected = e.target.value;
      if (selected === "Alle") {
        renderRequests(allRequests);
      } else {
        const filtered = allRequests.filter((r) => r.status === selected);
        renderRequests(filtered);
      }
    });
  }
});
