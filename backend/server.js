// backend/server.js
// v20251213-BACKEND-UPLOADS-FIX-FINAL

const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Verbinding met MongoDB
connectDB();

// === UPLOADS STATISCH SERVEN (LOGO FIX) ===
// Alles in /uploads wordt publiek bereikbaar via:
// https://irisje-backend.onrender.com/uploads/...
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === ROUTES DYNAMISCH LADEN ===
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
    console.log(`✔️ Loaded route: ${route}`);
  } catch (err) {
    console.error(`❌ Route '${route}' kon niet geladen worden:`, err.message);
  }
});

// === FRONTEND HOSTING ===
app.use(express.static(path.join(__dirname, "..", "frontend")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend actief op poort ${PORT}`);
});
