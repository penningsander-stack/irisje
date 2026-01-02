// backend/server.js
// IRISJE.NL – server.js (FINAL FIX STATIC + ROUTING)
// Doel:
// - /style.css blijft werken vanuit frontend/
// - geen HTML-aanpassingen nodig
// - static files altijd vóór catch-all
// - geen MIME-type fouten meer

const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

/* =====================================================
   BASIS MIDDLEWARE
   ===================================================== */
app.use(cors());
app.use(express.json());

/* =====================================================
   DATABASE
   ===================================================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* =====================================================
   FRONTEND STATIC FILES  (⬅️ DIT IS DE CRUCIALE FIX)
   ===================================================== */

// frontend-map exact bepalen
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");

// Static files ALTIJD eerst
app.use(
  express.static(FRONTEND_PATH, {
    index: false,           // voorkom automatische index.html
    fallthrough: true       // laat API-routes door als bestand niet bestaat
  })
);

/* =====================================================
   API ROUTES
   ===================================================== */

app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));

/* =====================================================
   SPA FALLBACK (MOET HELEMAAL ONDERAAN)
   ===================================================== */

// Alleen als het GEEN API-call is en GEEN bestaand bestand
app.get("*", (req, res) => {
  // veiligheid: API nooit vangen
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* =====================================================
   SERVER START
   ===================================================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Irisje backend draait op poort ${PORT}`);
});
