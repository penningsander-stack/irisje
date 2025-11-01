// backend/utils/logHelper.js
/**
 * 🌸 Irisje.nl – LogHelper
 * Zorgt voor nette, korte logregels bij startup
 * en prefix "🌸 [Irisje]" voor alle interne meldingen.
 */

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

// Prefix toevoegen voor overzichtelijkheid
console.log = (...args) => {
  originalLog("🌸 [Irisje]", ...args);
};

console.error = (...args) => {
  originalError("🌸 [FOUT]", ...args);
};

console.warn = (...args) => {
  originalWarn("🌸 [WAARSCHUWING]", ...args);
};

// Extra nette banner bij opstart
function startupBanner() {
  console.log("=========================================");
  console.log("🌸 Irisje.nl backend gestart");
  console.log("📦 Build: automatisch geoptimaliseerd met Sharp");
  console.log("🔒 Config: .env gecontroleerd via validateEnv.js");
  console.log("=========================================");
}

module.exports = { startupBanner };
