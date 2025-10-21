// frontend/js/dashboard.js
// Doel: uitbreidingen toevoegen ZONDER bestaande logica te breken.
// - Leest bestaande tellerwaarden en tekent een Chart.js grafiek.
// - Zorgt voor veilige UI-acties (refresh grafiek, top-up modal).
// - Laat logout-implementatie ongemoeid (bestaat al en werkt).

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // ——— Grafiek tekenen op basis van tellerwaarden uit de DOM ———
  let chart;
  function readStatsFromDOM() {
    // Tellerwaarden kunnen door dashboard_safe.js worden gezet. We lezen ze uit DOM.
    const toInt = (el) => {
      if (!el) return 0;
      const n = parseInt(el.textContent.trim(), 10);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      total: toInt($("#statTotal")),
      accepted: toInt($("#statAccepted")),
      rejected: toInt($("#statRejected")),
      followedUp: toInt($("#statFollowedUp")),
    };
  }

  function renderChart() {
    const ctx = $("#statusChart");
    if (!ctx) return;

    const data = readStatsFromDOM();

    // Fallback: als total 0 is maar er wel rijen zijn, blijft grafiek leeg; dat is oké
    const dataset = [data.accepted, data.rejected, data.followedUp];

    if (chart) {
      chart.data.datasets[0].data = dataset;
      chart.update();
      return;
    }

    chart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Geaccepteerd", "Afgewezen", "Opgevolgd"],
        datasets: [
          {
            label: "Aantal",
            data: dataset,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
  }

  // ——— Veilige UI: top-up knop zonder backend afhankelijkheid ———
  function setupTopUp() {
    const btn = $("#topupBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      alert(
        "Opwaarderen komt er zo aan.\nWe bereiden de betaalfunctie (Mollie/Stripe) veilig voor zonder iets te breken."
      );
    });
  }

  // ——— Refresh-knop voor grafiek ———
  function setupRefreshChart() {
    const btn = $("#refreshChartBtn");
    if (!btn) return;
    btn.addEventListener("click", renderChart);
  }

  // ——— Init ———
  document.addEventListener("DOMContentLoaded", () => {
    // Wacht heel even zodat dashboard_safe.js eerst de DOM kan vullen
    setTimeout(() => {
      renderChart();
    }, 150);

    setupTopUp();
    setupRefreshChart();

    // Optioneel: automatische hertekening wanneer dashboard_safe.js cijfers wijzigt
    const statsContainer = document.body;
    const mo = new MutationObserver(() => {
      // throttle
      if (chart) {
        setTimeout(() => renderChart(), 50);
      }
    });
    mo.observe(statsContainer, { childList: true, subtree: true, characterData: true });
  });
})();
