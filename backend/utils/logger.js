// backend/utils/logger.js
// v20251210-FULL-FIX
//
// Volledig compatibele logger:
// - behoudt addLog(), getLogs(), route()
// - voegt toe: info(), error(), debug()
// - geschikt voor admin logs + server.js logging

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const MAX_LOG_LINES = 500; // admin memory buffer

// memory buffer voor admin panel
let memoryLogs = [];

// zorg dat map bestaat
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ----------------------------------------
// Kernfunctie: schrijf een logregel
// ----------------------------------------
function addLog(message, level = "info") {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // 1. schrijf naar memory buffer
  memoryLogs.push(formatted);
  if (memoryLogs.length > MAX_LOG_LINES) {
    memoryLogs.shift();
  }

  // 2. schrijf naar dagbestand
  const date = timestamp.split("T")[0];
  const filename = path.join(LOG_DIR, `irisje-${date}.log`);

  try {
    fs.appendFileSync(filename, formatted + "\n", "utf8");
  } catch (err) {
    console.error("Kon log niet wegschrijven:", err);
  }

  // 3. console output
  console.log(formatted);
}

// ----------------------------------------
// Ophalen logs voor admin panel
// ----------------------------------------
function getLogs() {
  return memoryLogs.slice(-MAX_LOG_LINES);
}

// ----------------------------------------
// Middleware voor request logging
// ----------------------------------------
function route(req, res, next) {
  addLog(`${req.method} ${req.originalUrl}`, "info");
  next();
}

// ----------------------------------------
// Nieuwe aliases voor jouw server.js
// ----------------------------------------
function info(msg) {
  addLog(msg, "info");
}

function error(msg) {
  addLog(msg, "error");
}

function debug(msg) {
  addLog(msg, "debug");
}

// ----------------------------------------
// EXPORTS
// ----------------------------------------
module.exports = {
  addLog,
  getLogs,
  route,
  info,   // nieuw
  error,  // nieuw
  debug,  // nieuw
};
