// backend/server.js
// v20260102-FIX-STATIC-CSS-ALIAS-CJS
// - Herstelt CommonJS (require) zodat Render/Node CJS niet crasht
// - Serve frontend statics (incl. correcte CSS content-type)
// - Alias: /css/style.css -> /style.css (zodat je GEEN HTML hoeft aan te passen)

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

// ---- App
const app = express();

// ---- Basic middleware
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- CORS (laat je bestaande origin(s) toe)
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];
app.use(
  cors({
    origin: function (origin, cb) {
      // allow no-origin (curl/postman)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true); // soepel houden zoals je eerder deed
    },
    credentials: true,
  })
);

// ---- DB connect (als je dit al hebt: laat het zo, maar dit is safe)
try {
  // Als je db helper hebt:
  // const connectDB = require("./config/db");
  // connectDB();
  const connectDB = require("./config/db");
  if (typeof connectDB === "function") connectDB();
} catch (e) {
  console.warn("[server] DB connect skipped/failed:", e.message);
}

// ---- API routes (zoals je projectstructuur aangeeft)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/seed", require("./routes/seed"));

// ---- Health
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// =====================================================
// FRONTEND STATIC (irisje.nl)
// =====================================================

// In jouw repo staat frontend als sibling van backend: /frontend
const FRONTEND_DIR = path.join(__dirname, "../frontend");

// 1) Static serve frontend root (zodat /style.css werkt)
app.use(
  express.static(FRONTEND_DIR, {
    setHeaders: (res, filePath) => {
      // Force correcte mime types (met name CSS)
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
      if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      }
    },
  })
);

// 2) Alias: /css/style.css -> frontend/style.css
//    (Dit fixt je “Refused to apply style ... /css/style.css” zonder HTML aanpassen)
app.get("/css/style.css", (req, res) => {
  const cssFile = path.join(FRONTEND_DIR, "style.css");
  res.type("text/css");
  res.sendFile(cssFile, (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});

// 3) Als je wél een /frontend/css map hebt, serve die ook (optioneel, safe)
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

// 4) SPA fallback (alleen voor niet-API routes)
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ---- API 404 (na routes)
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "Not Found" });
});

// ---- Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] listening on ${PORT}`);
});
