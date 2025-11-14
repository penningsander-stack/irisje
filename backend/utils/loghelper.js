// backend/utils/loghelper.js
/**
 * irisje.nl – loghelper
 * volledig consistent, camelCase & opgeschoond – 2025-11-14
 */

const { addLog } = require("./logger");

const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const line = `${colors.gray}===========================================${colors.reset}`;

/**
 * nette startup banner
 */
function startupBanner() {
  console.log(line);
  console.log(`${colors.magenta}🌸 irisje.nl backend gestart${colors.reset}`);
  console.log(`${colors.cyan}📦 build:${colors.reset} automatisch geoptimaliseerd`);
  console.log(`${colors.green}🔒 config:${colors.reset} .env gevalideerd`);
  console.log(`${colors.yellow}🕓 tijd:${colors.reset} ${new Date().toLocaleString("nl-NL")}`);
  console.log(line);

  // correcte functie uit logger.js
  addLog("irisje backend succesvol gestart", "info");
}

/**
 * hulploggers
 */
function irisLog(...args) {
  console.log(`${colors.magenta}🌸 [irisje]${colors.reset}`, ...args);
}

function irisWarn(...args) {
  console.warn(`${colors.yellow}🌸 [warning]${colors.reset}`, ...args);
}

function irisError(...args) {
  console.error(`${colors.red}🌸 [error]${colors.reset}`, ...args);
}

module.exports = {
  startupBanner,
  irisLog,
  irisWarn,
  irisError,
};
