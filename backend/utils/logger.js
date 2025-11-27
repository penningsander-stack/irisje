// backend/utils/logger.js
/**
 * irisje.nl – logger
 * volledig camelCase & consistent met server.js en loghelper.js
 */

const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const maxLogs = 20;
const retentionDays = 14;

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

let logs = [];

/* ------------------------------------------------------------
   huidig daglogbestand
------------------------------------------------------------ */
function currentLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(logDir, `irisje-${date}.log`);
}

/* ------------------------------------------------------------
   oude logs opruimen
------------------------------------------------------------ */
function cleanupOldLogs() {
  const files = fs.readdirSync(logDir);
  const now = Date.now();

  for (const file of files) {
    const filePath = path.join(logDir, file);
    try {
      const stats = fs.statSync(filePath);
      const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays > retentionDays) {
        fs.unlinkSync(filePath);
        console.log(`🧹 oude log verwijderd: ${file}`);
      }
    } catch (err) {
      console.warn("kon log niet controleren:", file, err.message);
    }
  }
}

/* ------------------------------------------------------------
   kleurdefinities en tijdnotatie
------------------------------------------------------------ */
const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function time() {
  return new Date().toLocaleTimeString("nl-NL", { hour12: false });
}

/* ------------------------------------------------------------
   log toevoegen (console + bestand + geheugen)
------------------------------------------------------------ */
function addLog(message, level = "info") {
  const entry = { timestamp: new Date().toISOString(), level, message };
  logs.push(entry);
  if (logs.length > maxLogs) logs.shift();

  const icons = { info: "✅", debug: "🟡", error: "❌" };
  const color = {
    info: colors.cyan,
    debug: colors.yellow,
    error: colors.red,
  }[level] || colors.reset;

  console.log(
    `${colors.gray}[${time()}]${colors.reset} ${color}${icons[level] || "ℹ️"}${colors.reset} ${message}`
  );

  try {
    const line = `[${entry.timestamp}] ${entry.level.toUpperCase()} → ${entry.message}\n`;
    fs.appendFileSync(currentLogFile(), line, "utf8");
  } catch (err) {
    console.warn("kon logbestand niet schrijven:", err.message);
  }
}

/* ------------------------------------------------------------
   http route logging
------------------------------------------------------------ */
function route(method, p, status, ms = 0) {
  const color =
    status >= 500 ? colors.red :
    status >= 400 ? colors.yellow :
    colors.green;

  console.log(
    `${colors.gray}[${time()}]${colors.reset} ${colors.cyan}${method.toUpperCase()}${colors.reset} ${p} → ${color}${status}${colors.reset} ${colors.gray}(${ms}ms)${colors.reset}`
  );
}

/* ------------------------------------------------------------
   laatste logs ophalen
------------------------------------------------------------ */
function getLogs() {
  return [...logs]
    .reverse()
    .map((l) => ({
      timestamp: l.timestamp || new Date().toISOString(),
      message: l.message || "",
      level: l.level || "info",
    }));
}

/* opruimen bij start */
cleanupOldLogs();

module.exports = {
  addLog,
  getLogs,
  route,
};
