// backend/utils/logger.js
/**
 * 🌸 Irisje.nl – Uitgebreide logger met automatische logrotatie
 * - Houdt 20 regels in geheugen (voor /status)
 * - Maakt dagelijks een nieuw logbestand
 * - Verwijdert bestanden ouder dan 14 dagen
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
const MAX_LOGS = 20;
const LOG_RETENTION_DAYS = 14;

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

let logs = [];

/**
 * Geef pad van het huidige daglogbestand terug.
 */
function currentLogFile() {
  const date = new Date().toISOString().slice(0, 10); // 2025-11-01
  return path.join(LOG_DIR, `irisje-${date}.log`);
}

/**
 * Verwijder oude logbestanden (ouder dan LOG_RETENTION_DAYS).
 */
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

/**
 * Voeg een nieuwe logregel toe.
 */
function addLog(message, level = "info") {
  const entry = {
    time: new Date().toISOString(),
    level,
    message
  };

  // Bewaar laatste 20 regels voor de statuspagina
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();

  // Kleuren in console
  const colors = {
    info: "\x1b[36m", // blauw
    debug: "\x1b[33m", // geel
    error: "\x1b[31m"  // rood
  };
  const color = colors[level] || "\x1b[0m";
  console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`);

  // Schrijf naar huidig daglog
  try {
    const line = `[${entry.time}] ${entry.level.toUpperCase()} → ${entry.message}\n`;
    fs.appendFileSync(currentLogFile(), line, "utf8");
  } catch (err) {
    console.warn("Kon logbestand niet schrijven:", err.message);
  }
}

/**
 * Geef logs in omgekeerde volgorde (nieuwste eerst).
 */
function getLogs() {
  return [...logs].reverse();
}

// 🧹 Opruimen uitvoeren bij opstart
cleanupOldLogs();

module.exports = { addLog, getLogs };
