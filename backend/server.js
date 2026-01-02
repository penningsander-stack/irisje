// backend/server.js
// v20260102-FINAL-FRONTEND-STATIC-FIX
// Serve frontend EXACT zoals hij is: frontend/style.css -> /style.css

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

/* =====================
   Middleware
===================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/* =====================
   Database
===================== */
try {
  const connectDB = require("./config/db");
  if (typeof connectDB === "function") connectDB();
} catch (e) {
  console.warn("DB connect skipped:", e.message);
}

/* =====================
   API routes
===================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/seed", require("./routes/seed"));

/* =====================
   FRONTEND (DIT IS DE KEY)
===================== */
const FRONTEND_DIR = path.join(__dirname, "../frontend");

/**
 * 👉 DIT is de ENIGE static serve die je nodig hebt
 * frontend/style.css  -> https://irisje.nl/style.css
 * frontend/select-companies.html -> https://irisje.nl/select-companies.html
 */
app.use(express.static(FRONTEND_DIR));

/* =====================
   SPA fallback (geen API)
===================== */
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

/* =====================
   Start
===================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});
