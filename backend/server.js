// backend/server.js – FIXED VERSION (publicRequests route corrected)

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Dynamisch routes laden
const routes = [
  "auth",
  "companies",
  "requests",
  "publicRequests",   // <-- FIXED (correct case!)
  "reviews",
  "admin",
  "email",
  "payments"
];

routes.forEach((route) => {
  try {
    app.use(`/api/${route}`, require(`./routes/${route}`));
    console.log(`✔️ Loaded route: ${route}`);
  } catch (err) {
    console.error(`❌ Route '${route}' kon niet geladen worden:`, err.message);
  }
});

// STATIC FRONTEND
app.use(express.static(path.join(__dirname, "..", "frontend")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend actief op poort ${PORT}`);
});
