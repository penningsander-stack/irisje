// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // Beheerder koppelen
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();
      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    return;
  }

  let alleAanvragen = [];
  let gefilterdeAanvragen = [];

  // Initieel laden
  await laadDashboard();

  // 🔄 Handmatige verversing
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    toonMelding("🔄 Aanvragen vernieuwen...");
    await laadDashboard();
    toonMelding("✅ Aanvragen vernieuwd!");
  });

  // 🚀 Automatische verversing elke 5 minuten
  setInterval(async () => {
    await laadDashboard();
    toonMelding("🔄 Automatisch vernieuwd");
  }, 5 * 60 * 1000);

  // Uitloggen
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Filter
  const statusFilter = document.getElementById("statusFilter");
  statusFilter.addEventListener("change", () => {
    const waarde = statusFilter.value;
    gefilterdeAanvragen = waarde
      ? alleAanvragen.filter((r) => (r.status || "Nieuw") === waarde)
      : [...alleAanvragen];
    renderAanvragen(gefilterdeAanvragen);
    updateStats(gefilterdeAanvragen);
    updateCharts(gefilterdeAanvragen);
  });

  // Functies
  async function laadDashboard() {
    alleAanvragen = await fetchAanvragen();
    const reviews = await fetchReviews(companyId);
    gefilterdeAanvragen = [...alleAanvragen];
    renderAanvragen(alleAanvragen);
    renderReviews(reviews);
    updateStats(alleAanvragen);
    updateCharts(alleAanvragen);
  }

  async function fetchAanvragen() {
    try {
      const res = await fetch(`${API_BASE}/requests`, { credentials: "include" });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      return [];
    }
  }

  async function fetchReviews(companyId) {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      return [];
    }
  }

  async function wijzigStatus(id, nieuweStatus) {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nieuweStatus }),
        credentials: "include",
      });
      if (res.ok) {
        const aanvraag = alleAanvragen.find((a) => a._id === id);
        if (aanvraag) aanvraag.status = nieuweStatus;
        renderAanvragen(gefilterdeAanvragen);
        updateStats(gefilterdeAanvragen);
        updateCharts(gefilterdeAanvragen);
        toonMelding("✅ Status bijgewerkt!");
      } else {
        toonMelding("⚠️ Kon status niet opslaan.", true);
      }
    } catch (err) {
      console.error("Fout bij status bijwerken:", err);
      toonMelding("❌ Fout bij status bijwerken.", true);
    }
  }

  function renderAanvragen(aanvragen) {
    const body = document.getElementById("request-table-body");
    if (!aanvragen.length) {
      body.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      return;
    }

    const rows = aanvragen
      .map((req) => {
        const d = new Date(req.date || req.createdAt);
        const datum = isNaN(d.getTime())
          ? "-"
          : d.toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
        const status = req.status || "Nieuw";
        return `
          <tr class="border-t text-sm align-top">
            <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(req.name)}</td>
            <td class="px-4 py-3 text-gray-700">${escapeHTML(req.email)}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs break-words">${escapeHTML(req.message)}</td>
            <td class="px-4 py-3">
              <select data-id="${req._id}"
                class="border border-gray-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500">
                <option value="Nieuw" ${status === "Nieuw" ? "selected" : ""}>Nieuw</option>
                <option value="Geaccepteerd" ${status === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
                <option value="Afgewezen" ${status === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
                <option value="Opgevolgd" ${status === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
              </select>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    body.innerHTML = rows;

    body.querySelectorAll("select[data-id]").forEach((el) => {
      el.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        const nieuweStatus = e.target.value;
        wijzigStatus(id, nieuweStatus);
      });
    });
  }

  function renderReviews(reviews) {
    const body = document.getElementById("review-table-body");
    if (!reviews.length) {
      body.innerHTML =
        "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      return;
    }

    const rows = reviews
      .map((rev) => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = isNaN(d.getTime())
          ? "-"
          : d.toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
        return `
          <tr class="border-t text-sm align-top">
            <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(rev.name)}</td>
            <td class="px-4 py-3 text-yellow-500 text-xs">${"⭐".repeat(rev.rating || 0)}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs break-words">${escapeHTML(rev.message)}</td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    body.innerHTML = rows;
  }

  function updateStats(aanvragen) {
    document.getElementById("total").textContent = aanvragen.length;
    document.getElementById("accepted").textContent = aanvragen.filter((a) => a.status === "Geaccepteerd").length;
    document.getElementById("rejected").textContent = aanvragen.filter((a) => a.status === "Afgewezen").length;
    document.getElementById("followed-up").textContent = aanvragen.filter((a) => a.status === "Opgevolgd").length;
  }

  // =======================
  // 📊 Chart.js grafieken
  // =======================
  let maandChart, statusChart;

  function updateCharts(aanvragen) {
    // === Aanvragen per maand ===
    const maandLabels = [];
    const maandCounts = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("nl-NL", { month: "short" });
      maandLabels.push(label);

      const count = aanvragen.filter((a) => {
        const ad = new Date(a.date || a.createdAt);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }).length;
      maandCounts.push(count);
    }

    const ctx1 = document.getElementById("requestsPerMonthChart");
    if (maandChart) maandChart.destroy();
    maandChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: maandLabels,
        datasets: [
          {
            label: "Aanvragen",
            data: maandCounts,
            backgroundColor: "#4F46E5",
            borderRadius: 6,
          },
        ],
      },
      options: {
        animation: { duration: 800 },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });

    // === Verdeling per status ===
    const statusData = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"].map(
      (s) => aanvragen.filter((a) => a.status === s).length
    );

    const ctx2 = document.getElementById("statusDistributionChart");
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
        datasets: [
          {
            data: statusData,
            backgroundColor: ["#6366F1", "#22C55E", "#EF4444", "#F59E0B"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        animation: { duration: 800 },
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#374151" },
          },
        },
      },
    });
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toonMelding(tekst, isFout = false) {
    let box = document.getElementById("meldingBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "meldingBox";
      box.className =
        "fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition opacity-0";
      document.body.appendChild(box);
    }

    box.textContent = tekst;
    box.className =
      "fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium " +
      (isFout ? "bg-red-600 text-white" : "bg-green-600 text-white");
// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // Beheerder koppelen
  if (email === "info@irisje.nl" && !companyId) {
    try {
      const ownerRes = await fetch(`${API_BASE}/companies/byOwner/${encodeURIComponent(email)}`);
      const ownerData = await ownerRes.json();
      if (ownerRes.ok && ownerData.length > 0) {
        companyId = ownerData[0]._id;
        localStorage.setItem("companyId", companyId);
      }
    } catch (err) {
      console.error("Fout bij ophalen bedrijven:", err);
    }
  }

  if (!companyId) {
    document.getElementById("request-table-body").innerHTML =
      "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen bedrijf gevonden (log opnieuw in).</td></tr>";
    return;
  }

  let alleAanvragen = [];
  let gefilterdeAanvragen = [];

  // Initieel laden
  await laadDashboard();

  // 🔄 Handmatige verversing
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    toonMelding("🔄 Aanvragen vernieuwen...");
    await laadDashboard();
    toonMelding("✅ Aanvragen vernieuwd!");
  });

  // 🚀 Automatische verversing elke 5 minuten
  setInterval(async () => {
    await laadDashboard();
    toonMelding("🔄 Automatisch vernieuwd");
  }, 5 * 60 * 1000);

  // Uitloggen
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // Filter
  const statusFilter = document.getElementById("statusFilter");
  statusFilter.addEventListener("change", () => {
    const waarde = statusFilter.value;
    gefilterdeAanvragen = waarde
      ? alleAanvragen.filter((r) => (r.status || "Nieuw") === waarde)
      : [...alleAanvragen];
    renderAanvragen(gefilterdeAanvragen);
    updateStats(gefilterdeAanvragen);
    updateCharts(gefilterdeAanvragen);
  });

  // Functies
  async function laadDashboard() {
    alleAanvragen = await fetchAanvragen();
    const reviews = await fetchReviews(companyId);
    gefilterdeAanvragen = [...alleAanvragen];
    renderAanvragen(alleAanvragen);
    renderReviews(reviews);
    updateStats(alleAanvragen);
    updateCharts(alleAanvragen);
  }

  async function fetchAanvragen() {
    try {
      const res = await fetch(`${API_BASE}/requests`, { credentials: "include" });
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Fout bij laden aanvragen:", err);
      return [];
    }
  }

  async function fetchReviews(companyId) {
    try {
      const res = await fetch(`${API_BASE}/reviews/company/${companyId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Fout bij laden reviews:", err);
      return [];
    }
  }

  async function wijzigStatus(id, nieuweStatus) {
    try {
      const res = await fetch(`${API_BASE}/requests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nieuweStatus }),
        credentials: "include",
      });
      if (res.ok) {
        const aanvraag = alleAanvragen.find((a) => a._id === id);
        if (aanvraag) aanvraag.status = nieuweStatus;
        renderAanvragen(gefilterdeAanvragen);
        updateStats(gefilterdeAanvragen);
        updateCharts(gefilterdeAanvragen);
        toonMelding("✅ Status bijgewerkt!");
      } else {
        toonMelding("⚠️ Kon status niet opslaan.", true);
      }
    } catch (err) {
      console.error("Fout bij status bijwerken:", err);
      toonMelding("❌ Fout bij status bijwerken.", true);
    }
  }

  function renderAanvragen(aanvragen) {
    const body = document.getElementById("request-table-body");
    if (!aanvragen.length) {
      body.innerHTML =
        "<tr><td colspan='5' class='text-center text-gray-500 p-4'>Geen aanvragen gevonden.</td></tr>";
      return;
    }

    const rows = aanvragen
      .map((req) => {
        const d = new Date(req.date || req.createdAt);
        const datum = isNaN(d.getTime())
          ? "-"
          : d.toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
        const status = req.status || "Nieuw";
        return `
          <tr class="border-t text-sm align-top">
            <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(req.name)}</td>
            <td class="px-4 py-3 text-gray-700">${escapeHTML(req.email)}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs break-words">${escapeHTML(req.message)}</td>
            <td class="px-4 py-3">
              <select data-id="${req._id}"
                class="border border-gray-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500">
                <option value="Nieuw" ${status === "Nieuw" ? "selected" : ""}>Nieuw</option>
                <option value="Geaccepteerd" ${status === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
                <option value="Afgewezen" ${status === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
                <option value="Opgevolgd" ${status === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
              </select>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    body.innerHTML = rows;

    body.querySelectorAll("select[data-id]").forEach((el) => {
      el.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        const nieuweStatus = e.target.value;
        wijzigStatus(id, nieuweStatus);
      });
    });
  }

  function renderReviews(reviews) {
    const body = document.getElementById("review-table-body");
    if (!reviews.length) {
      body.innerHTML =
        "<tr><td colspan='4' class='text-center text-gray-500 p-4'>Nog geen reviews.</td></tr>";
      return;
    }

    const rows = reviews
      .map((rev) => {
        const d = new Date(rev.createdAt || rev.date);
        const datum = isNaN(d.getTime())
          ? "-"
          : d.toLocaleDateString("nl-NL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
        return `
          <tr class="border-t text-sm align-top">
            <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(rev.name)}</td>
            <td class="px-4 py-3 text-yellow-500 text-xs">${"⭐".repeat(rev.rating || 0)}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs break-words">${escapeHTML(rev.message)}</td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    body.innerHTML = rows;
  }

  function updateStats(aanvragen) {
    document.getElementById("total").textContent = aanvragen.length;
    document.getElementById("accepted").textContent = aanvragen.filter((a) => a.status === "Geaccepteerd").length;
    document.getElementById("rejected").textContent = aanvragen.filter((a) => a.status === "Afgewezen").length;
    document.getElementById("followed-up").textContent = aanvragen.filter((a) => a.status === "Opgevolgd").length;
  }

  // =======================
  // 📊 Chart.js grafieken
  // =======================
  let maandChart = null;
  let statusChart = null;

  function updateCharts(aanvragen) {
    // === Aanvragen per maand ===
    const maandLabels = [];
    const maandCounts = [];

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("nl-NL", { month: "short" });
      maandLabels.push(label);

      const count = aanvragen.filter((a) => {
        const ad = new Date(a.date || a.createdAt);
        return ad.getMonth() === d.getMonth() && ad.getFullYear() === d.getFullYear();
      }).length;
      maandCounts.push(count);
    }

    const ctx1 = document.getElementById("requestsPerMonthChart");
    if (maandChart) maandChart.destroy(); // ✅ alleen als hij al bestaat
    maandChart = new Chart(ctx1, {
      type: "bar",
      data: {
        labels: maandLabels,
        datasets: [
          {
            label: "Aanvragen",
            data: maandCounts,
            backgroundColor: "#4F46E5",
            borderRadius: 6,
          },
        ],
      },
      options: {
        animation: { duration: 800 },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { display: false } },
      },
    });

    // === Verdeling per status ===
    const statusData = ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"].map(
      (s) => aanvragen.filter((a) => a.status === s).length
    );

    const ctx2 = document.getElementById("statusDistributionChart");
    if (statusChart) statusChart.destroy();
    statusChart = new Chart(ctx2, {
      type: "doughnut",
      data: {
        labels: ["Nieuw", "Geaccepteerd", "Afgewezen", "Opgevolgd"],
        datasets: [
          {
            data: statusData,
            backgroundColor: ["#6366F1", "#22C55E", "#EF4444", "#F59E0B"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        animation: { duration: 800 },
        plugins: {
          legend: { position: "bottom", labels: { color: "#374151" } },
        },
      },
    });
  }

  function escapeHTML(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toonMelding(tekst, isFout = false) {
    let box = document.getElementById("meldingBox");
    if (!box) {
      box = document.createElement("div");
      box.id = "meldingBox";
      box.className =
        "fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition opacity-0";
      document.body.appendChild(box);
    }

    box.textContent = tekst;
    box.className =
      "fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium " +
      (isFout ? "bg-red-600 text-white" : "bg-green-600 text-white");

    box.style.opacity = "1";
    setTimeout(() => {
      box.style.opacity = "0";
    }, 2000);
  }
});

    box.style.opacity = "1";
    setTimeout(() => {
      box.style.opacity = "0";
    }, 2000);
  }
});
