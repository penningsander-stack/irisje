// backend/server.js
// v20251213-ADMIN-LOGGING-ACTIVE
//
// Complete versie mét logging voor adminpanel:
// - Request logging
// - Server start logging
// - MongoDB connect logging
// - Error logging
// - Compatibel met jouw huidige backendstructuur

const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const logger = require("./utils/logger"); // <-- logging toegevoegd

const app = express();

// =========================================
// Middleware
// =========================================
app.use(express.json());
app.use(cors());

// =========================================
// MongoDB + logging
// =========================================
logger.info("🚀 Backend server wordt gestart…");

connectDB()
  .then(() => logger.info("✔️ MongoDB succesvol verbonden"))
  .catch((err) => logger.error("❌ MongoDB fout: " + err.message));

// =========================================
// Request logging
// =========================================
app.use((req, res, next) => {
  logger.info(`[REQ] ${req.method} ${req.url}`);
  next();
});

// =========================================
// UPLOADS STATISCH SERVEN
// =========================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// =========================================
// FRONTEND STATISCH SERVEN (EXPLICIET)
// =========================================
app.use(
  "/frontend",
  express.static(path.join(__dirname, "..", "frontend"), {
    extensions: ["css", "js", "html"],
  })
);









// =========================================
// ROUTES DYNAMISCH LADEN
// =========================================
const routes = [
  "auth",
  "companies",
  "requests",
  "publicRequests",
  "reviews",
  "admin",
  "email",
  "payments",
  "status",
  "claims",
  "dashboard",
  "googlereviews",
  "seed",
  "importer_places",
];

routes.forEach((route) => {
  try {
    app.use(`/api/${route}`, require(`./routes/${route}`));
    logger.info(`✔️ Loaded route: ${route}`);
  } catch (err) {
    logger.error(`❌ Route '${route}' kon niet geladen worden: ${err.message}`);
  }
});

// =========================================
// ADMIN TOOLS (stats/health)
// =========================================
try {
  const adminToolsRouter = require("./routes/adminTools");
  app.use("/api/admin", adminToolsRouter);
  logger.info("✔️ Loaded admin tools routes (stats/health)");
} catch (err) {
  logger.error("❌ Admin tools routes konden niet geladen worden: " + err.message);
}

// =========================================
// FRONTEND HOSTING
// =========================================
app.use(express.static(path.join(__dirname, "..", "frontend")));

// =========================================
// SPA FALLBACK
// =========================================
app.get(/^\/((?!uploads|api).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// =========================================
// Error logging middleware
// =========================================
app.use((err, req, res, next) => {
  logger.error(`[ERROR] ${err.message}`);
  next(err);
});

// =========================================
// Server starten
// =========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Backend actief op poort ${PORT}`);
  console.log(`🚀 Backend actief op poort ${PORT}`);
});
