// backend/utils/loghelper.js
/**
 * irisje.nl – loghelper
 * volledig opgeschoond, camelCase en consistent met server.js
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

/**
 * toon nette startup-banner
 */
function startupBanner() {
  const line = `${colors.gray}===========================================${colors.reset}`;
  console.log(line);
  console.log(`${colors.magenta}🌸 irisje.nl backend gestart${colors.reset}`);
  console.log(`${colors.cyan}📦 build:${colors.reset} automatisch geoptimaliseerd`);
  console.log(`${colors.green}🔒 config:${colors.reset} .env gecontroleerd via validateenv.js`);
  console.log(`${colors.yellow}🕓 tijd:${colors.reset} ${new Date().toLocaleString("nl-NL")}`);
  console.log(line);

  addLog("irisje backend succesvol gestart", "info");
}

function irisLog(...args) {
  console.log(`${colors.magenta}🌸 [irisje]${colors.reset}`, ...args);
}
function irisWarn(...args) {
  console.warn(`${colors.yellow}🌸 [waarschuwing]${colors.reset}`, ...args);
}
function irisError(...args) {
  console.error(`${colors.red}🌸 [fout]${colors.reset}`, ...args);
}

module.exports = {
  startupBanner,
  irisLog,
  irisWarn,
  irisError,
};
