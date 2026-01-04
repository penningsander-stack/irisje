// backend/server.js
// v2026-01-06 FULL-FIX-PUBLIC-REQUESTS-MOUNT

require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* =========================
 * Middleware
 * ========================= */
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
 * MongoDB
 * ========================= */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI ontbreekt");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* =========================
 * Routes
 * ========================= */
app.use("/api/publicCompanies", require("./routes/publicCompanies"));
app.use("/api/publicRequests", require("./routes/publicRequests")); // ← BELANGRIJK
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payments", require("./routes/payments"));

/* =========================
 * Health
 * ========================= */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/* =========================
 * Frontend (static)
 * ========================= */
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

// Fallback voor SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* =========================
 * Server
 * ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
