// backend/utils/loghelper.js
/**
 * 🌸 Irisje.nl – LogHelper (visueel verbeterd)
 * --------------------------------------------------
 * ✅ Kleurrijke banner bij opstart
 * ✅ Geen globale console-override meer (veiliger)
 * ✅ Consistente opmaak met logger.js
 */

const { addLog } = require("./logger");

const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

/**
 * Toon nette startup-banner (voor console én logs)
 */
function startupBanner() {
  const line = `${COLORS.gray}===========================================${COLORS.reset}`;
  console.log(line);
  console.log(`${COLORS.magenta}🌸 Irisje.nl backend gestart${COLORS.reset}`);
  console.log(`${COLORS.cyan}📦 Build:${COLORS.reset} automatisch geoptimaliseerd met Sharp`);
  console.log(`${COLORS.green}🔒 Config:${COLORS.reset} .env gecontroleerd via validateEnv.js`);
  console.log(`${COLORS.yellow}🕓 Tijd:${COLORS.reset} ${new Date().toLocaleString("nl-NL")}`);
  console.log(line);

  addLog("Irisje backend succesvol gestart", "info");
}

/**
 * Hulplogs met vaste prefix voor eigen scripts (optioneel)
 */
function irisLog(...args) {
  console.log(`${COLORS.magenta}🌸 [Irisje]${COLORS.reset}`, ...args);
}
function irisWarn(...args) {
  console.warn(`${COLORS.yellow}🌸 [WAARSCHUWING]${COLORS.reset}`, ...args);
}
function irisError(...args) {
  console.error(`${COLORS.red}🌸 [FOUT]${COLORS.reset}`, ...args);
}

module.exports = {
  startupBanner,
  irisLog,
  irisWarn,
  irisError,
};
