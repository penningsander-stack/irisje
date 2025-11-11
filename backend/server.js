// backend/server.js
require("./config/validateEnv");
const { startupBanner } = require("./utils/logHelper");

const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { corsMiddleware, securityHeaders } = require("./config/security");
const { addLog } = require("./utils/logger");

const app = express();

/* ============================================================
   ✅ Basis middleware
============================================================ */
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(compression());
app.use(corsMiddleware);
app.use(securityHeaders);

/* ============================================================
   ✅ MongoDB connectie
============================================================ */
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("🌸 [FOUT] Geen MongoDB URI gevonden");
  addLog("Geen MongoDB URI gevonden", "error");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    console.log("🌸 [Irisje] ✅ MongoDB connected");
    addLog("MongoDB connected", "info");
  })
  .catch((err) => {
    console.error("🌸 [FOUT] MongoDB error:", err.message);
    addLog("MongoDB connection error: " + err.message, "error");
  });

/* ============================================================
   📁 Statische map voor e-mailpagina’s (review confirm/failed)
============================================================ */
app.use(express.static(path.join(__dirname, "public")));
// → maakt /review-confirm.html en /review-failed.html toegankelijk

/* ============================================================
   ✅ API-routes
============================================================ */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/status", require("./routes/status"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/google-reviews", require("./routes/googleReviews"));
app.use("/api/seed", require("./routes/seed"));
app.use("/api/importer", require("./routes/importer_places"));

/* ============================================================
   ✅ Testroute
============================================================ */
app.get("/api/test", (req, res) => {
  addLog("API test uitgevoerd", "debug");
  res.json({ ok: true, message: "Server ziet routes correct" });
});

/* ============================================================
   🖼️ Slimme image-serve middleware (WebP-detectie)
============================================================ */
app.get(/\.(jpg|jpeg|png)$/i, (req, res, next) => {
  const originalPath = path.join(__dirname, "../frontend", req.path);
  const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const acceptsWebp = req.headers.accept?.includes("image/webp");

  if (acceptsWebp && fs.existsSync(webpPath)) {
    res.sendFile(webpPath);
  } else if (fs.existsSync(originalPath)) {
    res.sendFile(originalPath);
  } else {
    next();
  }
});

/* ============================================================
   ✅ Statische frontend-bestanden met cache-headers
============================================================ */
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath, {
  setHeaders: (res, filePath) => {
    // 📦 Cache statische assets 7 dagen, behalve HTML
    if (/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    } else {
      // HTML & JSON nooit langdurig cachen
      res.setHeader("Cache-Control", "no-store");
    }
  }
}));

/* ============================================================
   🪄 HTML-injecties (preload + lazyload)
============================================================ */
app.use(/.*\.html$/, (req, res, next) => {
  const filePath = path.join(__dirname, "../frontend", req.path);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, "utf8");

  if (!html.includes("fonts.googleapis.com") && html.includes("<head>")) {
    const preloadBlock = `
    <!-- Injected performance preload -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preload" as="style" href="style.css?v=20251110">
    <link rel="preload" as="image" href="favicon.ico">
    `;
    html = html.replace(/<head>/i, `<head>${preloadBlock}`);
  }

  if (!html.includes("js/lazyload.js")) {
    html = html.replace(/<\/body>/i, `  <script src="js/lazyload.js"></script>\n</body>`);
  }

  if (req.path === "/status.html" && !html.includes("js/status-enhanced.js")) {
    html = html.replace(/<\/body>/i, `  <script src="js/status-enhanced.js"></script>\n</body>`);
  }

  res.type("html").send(html);
});

/* ============================================================
   ✅ Frontend fallback
============================================================ */
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* ============================================================
   ✅ Server starten
============================================================ */
const PORT = process.env.PORT || 3000;
startupBanner();
addLog("Server gestart op poort " + PORT, "info");

app.listen(PORT, () => {
  console.log(`🌸 [Irisje] 🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
