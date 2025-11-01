// backend/utils/logger.js
/**
 * 🌸 Irisje.nl – Uitgebreide in-memory logger
 * Bewaart laatste 20 regels in RAM + kleurige console-uitvoer.
 */

const fs = require("fs");
const path = require("path");

const MAX_LOGS = 20;
const logs = [];
const LOG_FILE = path.join(__dirname, "../logs/irisje.log");

function addLog(message, level = "info") {
  const entry = {
    time: new Date().toISOString(),
    level,
    message
  };

  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift();

  // 🎨 Kleuren in console
  const colors = {
    info: "\x1b[36m", // blauw
    debug: "\x1b[33m", // geel
    error: "\x1b[31m"  // rood
  };
  const color = colors[level] || "\x1b[0m";
  console.log(`${color}[${level.toUpperCase()}] ${message}\x1b[0m`);

  // 💾 Ook naar bestand loggen
  try {
    const line = `[${entry.time}] ${entry.level.toUpperCase()} → ${entry.message}\n`;
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (err) {
    console.warn("Kon logbestand niet schrijven:", err.message);
  }
}

function getLogs() {
  return [...logs].reverse();
}

module.exports = { addLog, getLogs };
