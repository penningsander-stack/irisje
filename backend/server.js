// backend/server.js
// v2026-01-14 – FIX: juiste casing voor publicRequests route

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const companiesMatchRoutes = require("./routes/companiesMatch");
app.use("/api/companies", companiesMatchRoutes);




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
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* =========================
 * API Routes
 * ========================= */

// ⚠️ BELANGRIJK: casing moet exact overeenkomen
app.use("/api/publicRequests", require("./routes/publicRequests"));

app.use("/api/companies", require("./routes/companies"));
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
