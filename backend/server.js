// backend/server.js
// v20260103-FIX-CJS-STATIC-API
// - CommonJS (require) zodat Node/Render niet crasht
// - Serve frontend uit /frontend
// - Serve /css/* assets (o.a. /css/style.css) zonder MIME-problemen
// - SPA fallback alleen voor "echte" paginaroutes (niet voor assets met een extensie)

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// -------------------- middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------- CORS
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // soepel (zoals je eerder wilde): niet hard blokkeren
      return cb(null, true);
    },
    credentials: true,
  })
);

// -------------------- DB connect
try {
  const connectDB = require("./config/db");
  if (typeof connectDB === "function") connectDB();
} catch (e) {
  console.warn("[server] DB connect skipped/failed:", e.message);
}

// -------------------- API routes
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
  res.json({ ok: true, ts: new Date().toISOString() });
});

// =====================================================
// FRONTEND STATIC (irisje.nl)
// =====================================================
const FRONTEND_DIR = path.join(__dirname, "../frontend");

// 1) Serve alles uit /frontend (dus /style.css, /js/*, /select-companies.html, etc.)
app.use(
  express.static(FRONTEND_DIR, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    },
  })
);

// 2) (extra) serve /frontend/css expliciet onder /css
//    Belangrijk: zorg dat je bestand op disk bestaat als: frontend/css/style.css
app.use(
  "/css",
  express.static(path.join(FRONTEND_DIR, "css"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
    },
  })
);

// 3) SPA fallback (alleen als het GEEN asset-pad is en GEEN /api)
//    => voorkomt dat /css/style.css per ongeluk index.html terugkrijgt.
app.get(/^\/(?!api\/).*/, (req, res) => {
  // Als er een punt in het pad zit (bijv. .css/.js/.png), dan is het een asset.
  // Dan géén SPA fallback; geef 404 zodat je browser geen verkeerde MIME krijgt.
  if (req.path.includes(".")) {
    return res.status(404).type("text/plain").send("Not Found");
  }
  return res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// -------------------- API 404
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

// -------------------- start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on ${PORT}`);
});
