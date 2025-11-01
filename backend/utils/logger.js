// backend/utils/logger.js
/**
 * 🌸 Irisje.nl – In-memory logger voor status-overzicht
 * Bewaart de laatste 10 logregels in RAM zodat ze via /api/status zichtbaar zijn.
 */

const MAX_LOGS = 10;
const logs = [];

function addLog(message, level = "info") {
  const entry = {
    time: new Date().toISOString(),
    level,
    message
  };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.shift(); // oudste verwijderen
  console.log(`[${level.toUpperCase()}] ${message}`);
}

function getLogs() {
  return [...logs].reverse(); // nieuwste eerst
}

module.exports = { addLog, getLogs };
