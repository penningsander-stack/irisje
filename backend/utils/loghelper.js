// backend/utils/loghelper.js
/**
 * irisje.nl – loghelper
 * volledig lowercase en consistent met server.js
 */

const { addlog } = require("./logger");

const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
};

/**
 * toon nette startup-banner
 */
function startupbanner() {
  const line = `${colors.gray}===========================================${colors.reset}`;
  console.log(line);
  console.log(`${colors.magenta}🌸 irisje.nl backend gestart${colors.reset}`);
  console.log(`${colors.cyan}📦 build:${colors.reset} automatisch geoptimaliseerd`);
  console.log(`${colors.green}🔒 config:${colors.reset} .env gecontroleerd via validateenv.js`);
  console.log(`${colors.yellow}🕓 tijd:${colors.reset} ${new Date().toLocaleString("nl-NL")}`);
  console.log(line);

  addlog("irisje backend succesvol gestart", "info");
}

/**
 * hulploggers
 */
function irislog(...args) {
  console.log(`${colors.magenta}🌸 [irisje]${colors.reset}`, ...args);
}
function iriswarn(...args) {
  console.warn(`${colors.yellow}🌸 [waarschuwing]${colors.reset}`, ...args);
}
function iriserror(...args) {
  console.error(`${colors.red}🌸 [fout]${colors.reset}`, ...args);
}

module.exports = {
  startupbanner,
  irislog,
  iriswarn,
  iriserror,
};
