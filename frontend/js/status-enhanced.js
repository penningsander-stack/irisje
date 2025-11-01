// frontend/js/status-enhanced.js
/**
 * 🌸 Irisje.nl – Statuspagina visual enhancer (v2)
 * Functies:
 * - kleurcodering van logs
 * - fade-in animaties
 * - statusindicator-tril bij fouten
 * - dynamische uptime-balk (groen→oranje→rood)
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
    logContainer.innerHTML = lines
      .map(line => {
        if (line.includes("ERROR")) return `<div class="text-red-600 font-medium">${line}</div>`;
        if (line.includes("DEBUG")) return `<div class="text-yellow-600">${line}</div>`;
        if (line.includes("INFO")) return `<div class="text-blue-600">${line}</div>`;
        return `<div class="text-gray-700">${line}</div>`;
      })
      .join("");
  }

  /* === 💫 2. Fade-in bij nieuwe logs === */
  if (logContainer) {
    const observer = new MutationObserver(() => {
      logContainer.style.opacity = "0.3";
      setTimeout(() => {
        logContainer.style.transition = "opacity 0.8s ease";
        logContainer.style.opacity = "1";
        applyLogColors();
      }, 50);
    });
    observer.observe(logContainer, { childList: true, subtree: true });
    applyLogColors();
  }

  /* === 🚨 3. Tril-effect bij 🔴 databasefout === */
  if (indicator) {
    const animateStatus = () => {
      if (indicator.textContent === "🔴") {
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
    const mins = parseInt(text) || 0;

    // 0–20 min = groen, 20–40 = oranje, >40 = rood
    let color = "bg-green-600";
    if (mins > 40) color = "bg-red-600";
    else if (mins > 20) color = "bg-yellow-500";

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
