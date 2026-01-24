// backend/server.js
// v2026-01-24 – FIX: expliciete CORS + opschonen routes

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* =========================
 * CORS (EXPLICIET & VEILIG)
 * ========================= */

const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server / Render health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

/* =========================
 * Middleware
 * ========================= */

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
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* =========================
 * API Routes
 * ========================= */

// ⚠️ casing exact houden
app.use("/api/publicRequests", require("./routes/publicRequests"));

app.use("/api/companies", require("./routes/companies"));
app.use("/api/companies", require("./routes/companiesMatch"));

app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/publiccategories", require("./routes/publicCategories"));
app.use("/api/meta", require("./routes/meta"));
app.use("/api/seed", require("./routes/seed"));

/* =========================
 * Health
 * ========================= */

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* =========================
 * 404 fallback (API only)
 * ========================= */

app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

/* =========================
 * Server
 * ========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
