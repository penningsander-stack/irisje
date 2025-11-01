// backend/config/validateEnv.js
/**
 * Controleer vereiste environment-variabelen vóór opstart.
 * Dit voorkomt stille fouten op Render (bijv. SMTP of JWT ontbreekt).
 */

require("dotenv").config();

const requiredVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM"
];

let missing = [];

for (const v of requiredVars) {
  if (!process.env[v]) missing.push(v);
}

if (missing.length > 0) {
  console.error("❌ Ontbrekende .env variabelen:");
  missing.forEach((v) => console.error("  -", v));
  console.error("🚫 Server wordt gestopt. Controleer je Render environment settings.");
  process.exit(1);
} else {
  console.log("✅ Alle vereiste .env variabelen aanwezig.");
}
