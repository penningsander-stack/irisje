// backend/utils/logger.js
/**
 * irisje.nl – logger
 * volledig in lowercase en consistent met server.js
 */

const fs = require("fs");
const path = require("path");

const log_dir = path.join(__dirname, "../logs");
const max_logs = 20;
const retention_days = 14;

if (!fs.existsSync(log_dir)) fs.mkdirSync(log_dir, { recursive: true });

let logs = [];

/* ------------------------------------------------------------
   huidig daglogbestand
------------------------------------------------------------ */
function current_log_file() {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(log_dir, `irisje-${date}.log`);
}

/* ------------------------------------------------------------
   oude logs opruimen
------------------------------------------------------------ */
function cleanup_old_logs() {
  const files = fs.readdirSync(log_dir);
  const now = Date.now();

  for (const file of files) {
    const file_path = path.join(log_dir, file);
    try {
      const stats = fs.statSync(file_path);
      const age_days = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
      if (age_days > retention_days) {
        fs.unlinkSync(file_path);
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
function addlog(message, level = "info") {
  const entry = { timestamp: new Date().toISOString(), level, message };
  logs.push(entry);
  if (logs.length > max_logs) logs.shift();

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
    fs.appendFileSync(current_log_file(), line, "utf8");
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
function getlogs() {
  return [...logs]
    .reverse()
    .map((l) => ({
      timestamp: l.timestamp || new Date().toISOString(),
      message: l.message || "",
      level: l.level || "info",
    }));
}

// opruimen bij start
cleanup_old_logs();

module.exports = {
  addlog,
  getlogs,
  route,
};
