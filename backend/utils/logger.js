// backend/utils/logger.js
/**
 * 🌸 Irisje.nl – Verbeterde logger met kleuren, logrotatie en route-weergave
 * ---------------------------------------------------------------
 * ✅ Houdt laatste 20 logs in geheugen (voor /status)
 * ✅ Schrijft dagelijks logbestand naar /logs/
 * ✅ Verwijdert bestanden ouder dan 14 dagen
 * ✅ Kleurige console-output met iconen
 * ✅ logger.route(method, path, status, ms) voor HTTP-verzoeken
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const MAX_LOGS = 20;
const LOG_RETENTION_DAYS = 14;

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

let logs = [];

/* ------------------------------------------------------------
   🔧 Helper: Huidig daglogbestand bepalen
------------------------------------------------------------ */
function currentLogFile() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `irisje-${date}.log`);
}

/* ------------------------------------------------------------
   🧹 Oude logbestanden opruimen
------------------------------------------------------------ */
function cleanupOldLogs() {
  const files = fs.readdirSync(LOG_DIR);
  const now = Date.now();

  for (const file of files) {
    const filePath = path.join(LOG_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      if (ageDays > LOG_RETENTION_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`🧹 Oude log verwijderd: ${file}`);
      }
    } catch (err) {
      console.warn("Kon log niet controleren:", file, err.message);
    }
  }
}

/* ------------------------------------------------------------
   🕒 Tijdnotatie + kleurdefinities
------------------------------------------------------------ */
const COLORS = {
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
   🧩 Log toevoegen (console + bestand + geheugen)
------------------------------------------------------------ */
function addLog(message, level = "info") {
  const entry = { timestamp: new Date().toISOString(), level, message };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();

  // Kleurige consoleoutput
  const icons = { info: "✅", debug: "🟡", error: "❌" };
  const colors = { info: COLORS.cyan, debug: COLORS.yellow, error: COLORS.red };
  const color = colors[level] || COLORS.reset;
  const icon = icons[level] || "ℹ️";

  console.log(`${COLORS.gray}[${time()}]${COLORS.reset} ${color}${icon}${COLORS.reset} ${message}`);

  // Schrijf naar daglog
  try {
    const line = `[${entry.timestamp}] ${entry.level.toUpperCase()} → ${entry.message}\n`;
    fs.appendFileSync(currentLogFile(), line, "utf8");
  } catch (err) {
    console.warn("Kon logbestand niet schrijven:", err.message);
  }
}

/* ------------------------------------------------------------
   📡 Route logging – overzichtelijk in Render
------------------------------------------------------------ */
function route(method, path, status, ms = 0) {
  const color =
    status >= 500 ? COLORS.red : status >= 400 ? COLORS.yellow : COLORS.green;
  console.log(
    `${COLORS.gray}[${time()}]${COLORS.reset} ${COLORS.cyan}${method.toUpperCase()}${COLORS.reset} ${path} → ${color}${status}${COLORS.reset} ${COLORS.gray}(${ms}ms)${COLORS.reset}`
  );
}

/* ------------------------------------------------------------
   🔁 Laatste logs ophalen (voor /status)
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

// 🧹 Opruimen uitvoeren bij opstart
cleanupOldLogs();

module.exports = { addLog, getLogs, route };
