// backend/config/validateEnv.js
/**
 * 🌸 Irisje.nl – Veilige .env-validatie
 * Controleert verplichte variabelen, maar blokkeert server alleen bij kritieke waarden.
 */

require("dotenv").config();

const criticalVars = ["MONGO_URI", "JWT_SECRET"];
const optionalVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM"
];

let missingCritical = [];
let missingOptional = [];

// Controleer kritieke waarden
for (const v of criticalVars) {
  if (!process.env[v]) missingCritical.push(v);
}

// Controleer optionele waarden
for (const v of optionalVars) {
  if (!process.env[v]) missingOptional.push(v);
}

if (missingCritical.length > 0) {
  console.error("❌ Kritieke .env variabelen ontbreken:");
  missingCritical.forEach((v) => console.error("  -", v));
  console.error("🚫 Server wordt gestopt. Controleer je Render environment settings.");
  process.exit(1);
} else {
  console.log("✅ Alle kritieke .env variabelen aanwezig.");
}

if (missingOptional.length > 0) {
  console.warn("⚠️ Optionele SMTP-variabelen ontbreken (mailfunctie uitgeschakeld):");
  missingOptional.forEach((v) => console.warn("  -", v));
} else {
  console.log("✅ Alle SMTP-variabelen aanwezig.");
}
