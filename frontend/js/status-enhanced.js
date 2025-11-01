// frontend/js/status-enhanced.js
/**
 * 🌸 Irisje.nl – Statuspagina visual enhancer (v3)
 * Verbeteringen:
 * - stabielere kleurupdates
 * - throttled observer
 * - consistente kleurcodering
 * - soepelere animaties
 * - uptimekleur berekend op tijd
 */

console.log("🌸 [Irisje] status-enhanced.js geladen");

document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("logContainer");
  const uptimeBar = document.getElementById("uptimeBar");
  const indicator = document.getElementById("statusIndicator");

  /* === 🎨 1. Kleurcodering logs === */
  function applyLogColors() {
    if (!logContainer) return;
    const lines = logContainer.innerText.split("\n");
    const html = lines
      .map(line => {
        const upper = line.toUpperCase();
        if (upper.includes("ERROR"))
          return `<div class="text-red-600 font-medium">${line}</div>`;
        if (upper.includes("DEBUG"))
          return `<div class="text-yellow-600">${line}</div>`;
        if (upper.includes("INFO"))
          return `<div class="text-blue-600">${line}</div>`;
        return `<div class="text-gray-700">${line}</div>`;
      })
      .join("");
    logContainer.innerHTML = html;
  }

  /* === 💫 2. Fade-in en throttled updates === */
  if (logContainer) {
    let updateTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(updateTimer);
      logContainer.style.opacity = "0.4";
      updateTimer = setTimeout(() => {
        logContainer.style.transition = "opacity 0.8s ease";
        logContainer.style.opacity = "1";
        applyLogColors();
      }, 120);
    });
    observer.observe(logContainer, { childList: true, subtree: true });
    applyLogColors();
  }

  /* === 🚨 3. Tril-effect bij 🔴 databasefout === */
  if (indicator) {
    const animateStatus = () => {
      if (indicator.textContent.trim() === "🔴") {
        indicator.style.animation = "shake 0.4s ease";
        setTimeout(() => (indicator.style.animation = ""), 400);
      }
    };
    const indObs = new MutationObserver(animateStatus);
    indObs.observe(indicator, { childList: true });
  }

  /* === 🌈 4. Dynamische uptime-balkkleur === */
  function updateUptimeColor() {
    if (!uptimeBar) return;
    const text = document.getElementById("uptime")?.textContent || "";
    const minsMatch = text.match(/(\d+)m/);
    const secsMatch = text.match(/(\d+)s/);
    const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
    const secs = secsMatch ? parseInt(secsMatch[1]) : 0;
    const total = mins + secs / 60;

    let color = "bg-green-600";
    if (total > 40) color = "bg-red-600";
    else if (total > 20) color = "bg-yellow-500";

    uptimeBar.className = `absolute left-0 top-0 h-3 transition-all duration-500 ${color}`;
  }

  setInterval(updateUptimeColor, 5000);
  updateUptimeColor();

  /* === 🪄 5. Extra CSS voor animaties === */
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0% { transform: translateX(0); }
      25% { transform: translateX(-3px); }
      50% { transform: translateX(3px); }
      75% { transform: translateX(-3px); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
});
