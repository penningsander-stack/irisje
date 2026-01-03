// backend/server.js
// v20260102-FINAL-STABLE-CJS

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

/* ======================
   BASIC MIDDLEWARE
====================== */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ======================
   DATABASE
====================== */
try {
  const connectDB = require("./config/db");
  if (typeof connectDB === "function") connectDB();
} catch (e) {
  console.warn("[server] DB not connected:", e.message);
}

/* ======================
   API ROUTES
====================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/seed", require("./routes/seed"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/* ======================
   FRONTEND STATIC FILES
====================== */

const FRONTEND_DIR = path.join(__dirname, "../frontend");

/**
 * 1️⃣ Serve frontend statics
 *    → DIT MOET VOOR DE SPA FALLBACK STAAN
 */
app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    },
  })
);

/**
 * 2️⃣ Extra zekerheid: /css map
 */
app.use(
  "/css",
  express.static(path.join(FRONTEND_DIR, "css"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
    },
  })
);

/* ======================
   SPA FALLBACK
   (NOOIT voor /api)
====================== */
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

/* ======================
   API 404
====================== */
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

/* ======================
   START
====================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] running on ${PORT}`);
});
