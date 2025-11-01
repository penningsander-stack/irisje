// frontend/js/status-enhanced.js
/**
 * 🌸 Irisje.nl – Statuspagina visual enhancer
 * Kleurcodering, fade-in en betere leesbaarheid van logs
 */

console.log("🌸 [Irisje] status-enhanced.js geladen");

document.addEventListener("DOMContentLoaded", () => {
  const logContainer = document.getElementById("logContainer");
  if (!logContainer) return;

  const applyColors = () => {
    const lines = logContainer.innerText.split("\n");
    logContainer.innerHTML = lines
      .map(line => {
        if (line.includes("ERROR")) {
          return `<div class="text-red-600 font-medium">${line}</div>`;
        } else if (line.includes("DEBUG")) {
          return `<div class="text-yellow-600">${line}</div>`;
        } else if (line.includes("INFO")) {
          return `<div class="text-blue-600">${line}</div>`;
        } else {
          return `<div class="text-gray-700">${line}</div>`;
        }
      })
      .join("");
  };

  // Kleine fade-in animatie bij nieuwe logs
  const observer = new MutationObserver(() => {
    logContainer.style.opacity = "0.3";
    setTimeout(() => {
      logContainer.style.transition = "opacity 0.8s ease";
      logContainer.style.opacity = "1";
      applyColors();
    }, 50);
  });

  observer.observe(logContainer, { childList: true, subtree: true });
  applyColors();

  // Visuele statusindicator-animatie (trillen bij fout)
  const indicator = document.getElementById("statusIndicator");
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

  // Kleine CSS-animatie inline toevoegen
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
