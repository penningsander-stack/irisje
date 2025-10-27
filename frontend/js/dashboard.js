// frontend/js/dashboard.js
const API_BASE = "https://irisje-backend.onrender.com/api";

document.addEventListener("DOMContentLoaded", async () => {
  const email = localStorage.getItem("userEmail");
  let companyId = localStorage.getItem("companyId");

  // Koppelen van beheer-account aan bedrijf indien nodig
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

  // data buffers
  let alleAanvragen = [];
  let gefilterdeAanvragen = [];

  // grafiek instances (zodat we ze kunnen updaten zonder ze dubbel te maken)
  let chartRequestsPerMonth = null;
  let chartStatusPie = null;

  // init load
  await laadDashboard();

  // handmatig verversen
  document.getElementById("refreshBtn").addEventListener("click", async () => {
    toonMelding("🔄 Aanvragen vernieuwen...");
    await laadDashboard();
    toonMelding("✅ Aanvragen vernieuwd!");
  });

  // automatische verversing elke 5 minuten
  setInterval(async () => {
    await laadDashboard();
    toonMelding("🔄 Automatisch vernieuwd");
  }, 5 * 60 * 1000);

  // uitloggen
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  // filter dropdown
  const statusFilter = document.getElementById("statusFilter");
  statusFilter.addEventListener("change", () => {
    const gekozen = statusFilter.value;
    gefilterdeAanvragen = gekozen
      ? alleAanvragen.filter((r) => (r.status || "Nieuw") === gekozen)
      : [...alleAanvragen];

    renderAanvragen(gefilterdeAanvragen);
    updateStats(gefilterdeAanvragen);
    updateStatusPieChart(chartStatusPie, gefilterdeAanvragen);
  });

  // --------- functies ---------

  async function laadDashboard() {
    // haal actuele data
    alleAanvragen = await fetchAanvragen();
    const reviews = await fetchReviews(companyId);

    gefilterdeAanvragen = [...alleAanvragen];

    // render schermdelen
    renderAanvragen(alleAanvragen);
    renderReviews(reviews);
    updateStats(alleAanvragen);

    // grafiekdata berekenen o.b.v. alleAanvragen
    const perMaandData = berekenAanvragenPerMaand(alleAanvragen);
    const statusVerdeling = berekenStatusVerdeling(alleAanvragen);

    // grafieken tekenen/bijwerken
    chartRequestsPerMonth = renderRequestsPerMonthChart(
      chartRequestsPerMonth,
      perMaandData.labels,
      perMaandData.values
    );

    chartStatusPie = renderStatusPieChart(
      chartStatusPie,
      statusVerdeling.labels,
      statusVerdeling.values
    );
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

        // ook grafiek "status verdeling" updaten
        const statusVerdeling = berekenStatusVerdeling(gefilterdeAanvragen);
        chartStatusPie = renderStatusPieChart(
          chartStatusPie,
          statusVerdeling.labels,
          statusVerdeling.values
        );

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
        const huidigeStatus = req.status || "Nieuw";

        return `
          <tr class="border-t text-sm align-top">
            <td class="px-4 py-3 font-medium text-gray-800">${escapeHTML(req.name)}</td>
            <td class="px-4 py-3 text-gray-700">${escapeHTML(req.email)}</td>
            <td class="px-4 py-3 text-gray-600 max-w-xs break-words">${escapeHTML(req.message)}</td>
            <td class="px-4 py-3">
              <select data-id="${req._id}"
                class="border border-gray-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-indigo-500">
                <option value="Nieuw" ${huidigeStatus === "Nieuw" ? "selected" : ""}>Nieuw</option>
                <option value="Geaccepteerd" ${huidigeStatus === "Geaccepteerd" ? "selected" : ""}>Geaccepteerd</option>
                <option value="Afgewezen" ${huidigeStatus === "Afgewezen" ? "selected" : ""}>Afgewezen</option>
                <option value="Opgevolgd" ${huidigeStatus === "Opgevolgd" ? "selected" : ""}>Opgevolgd</option>
              </select>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${datum}</td>
          </tr>`;
      })
      .join("");

    body.innerHTML = rows;

    // status dropdowns actief maken
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
    document.getElementById("accepted").textContent = aanvragen.filter(a => a.status === "Geaccepteerd").length;
    document.getElementById("rejected").textContent = aanvragen.filter(a => a.status === "Afgewezen").length;
    document.getElementById("followed-up").textContent = aanvragen.filter(a => a.status === "Opgevolgd").length;
  }

  // --------- grafiek helpers ---------

  // aantal aanvragen per maand (laatste 6 maanden)
  function berekenAanvragenPerMaand(aanvragen) {
    // maak map { "2025-10": 4, "2025-09": 2, ... }
    const counts = {};
    aanvragen.forEach((req) => {
      const d = new Date(req.date || req.createdAt);
      if (isNaN(d.getTime())) return;
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      counts[key] = (counts[key] || 0) + 1;
    });

    // sorteer keys (chronologisch)
    const sortedKeys = Object.keys(counts).sort();

    // pak alleen de laatste 6
    const lastSix = sortedKeys.slice(-6);

    // maak mooie labels zoals "okt 2025"
    const labels = lastSix.map((key) => {
      const [yyyy, mm] = key.split("-");
      const mIndex = parseInt(mm, 10) - 1;
      const maandNaam = maandKorteNaam(mIndex);
      return maandNaam + " " + yyyy;
    });

    const values = lastSix.map((key) => counts[key]);

    return { labels, values };
  }

  function maandKorteNaam(idx) {
    const maanden = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    return maanden[idx] || "";
  }

  // status verdeling nu
  function berekenStatusVerdeling(aanvragen) {
    const buckets = {
      Nieuw: 0,
      Geaccepteerd: 0,
      Afgewezen: 0,
      Opgevolgd: 0,
    };
    aanvragen.forEach((r) => {
      const st = r.status || "Nieuw";
      if (buckets[st] !== undefined) {
        buckets[st] += 1;
      }
    });

    const labels = Object.keys(buckets);
    const values = Object.values(buckets);
    return { labels, values };
  }

  function renderRequestsPerMonthChart(existingChart, labels, values) {
    const ctx = document.getElementById("requestsPerMonthChart");
    if (!ctx) return existingChart;

    if (existingChart) {
      existingChart.data.labels = labels;
      existingChart.data.datasets[0].data = values;
      existingChart.update();
      return existingChart;
    }

    return new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Aanvragen",
            data: values,
            backgroundColor: "rgba(79, 70, 229, 0.2)",    // indigo-600 light
            borderColor: "rgba(79, 70, 229, 1)",           // indigo-600
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            ticks: {
              precision: 0,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  function renderStatusPieChart(existingChart, labels, values) {
    const ctx = document.getElementById("statusPieChart");
    if (!ctx) return existingChart;

    if (existingChart) {
      existingChart.data.labels = labels;
      existingChart.data.datasets[0].data = values;
      existingChart.update();
      return existingChart;
    }

    return new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "rgba(37, 99, 235, 0.7)",   // blauw-ish voor Nieuw
              "rgba(16, 185, 129, 0.7)",  // groen voor Geaccepteerd
              "rgba(239, 68, 68, 0.7)",   // rood voor Afgewezen
              "rgba(245, 158, 11, 0.7)",  // geel voor Opgevolgd
            ],
            borderColor: [
              "rgba(37, 99, 235, 1)",
              "rgba(16, 185, 129, 1)",
              "rgba(239, 68, 68, 1)",
              "rgba(245, 158, 11, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 11 },
              color: "#374151",
            },
          },
        },
      },
    });
  }

  // helpers
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
