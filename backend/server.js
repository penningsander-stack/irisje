// backend/server.js
/**
 * 🌸 Irisje.nl – Server entrypoint (Render & local safe)
 * Verbeterd met kleurige request-logging, sitemap redirect en uniforme logstructuur.
 */

require("dotenv").config();
require("./config/validateenv");

const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const { corsMiddleware, securityHeaders } = require("./config/security");
const { addLog, route: logRoute } = require("./utils/logger");
const { startupBanner } = require("./utils/loghelper");

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
   🌈 Request logging middleware
============================================================ */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logRoute?.(req.method, req.originalUrl, res.statusCode, ms);
  });
  next();
});

/* ============================================================
   ✅ MongoDB connectie
============================================================ */
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  addLog("Geen MongoDB URI gevonden", "error");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => addLog("MongoDB connected", "info"))
  .catch((err) => addLog("MongoDB connection error: " + err.message, "error"));

/* ============================================================
   📁 Publieke bestanden (bv. e-mailsjablonen)
============================================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ============================================================
   ✅ API-routes
============================================================ */
const routes = [
  "auth",
  "companies",
  "requests",
  "publicrequests",
  "reviews",
  "admin",
  "email",
  "payments",
  "status",
  "claims",
  "googlereviews",
  "seed",
  "importer_places",
];

for (const route of routes) {
  try {
    app.use(`/api/${route}`, require(`./routes/${route}`));
  } catch (err) {
    addLog(`⚠️ Route '${route}' kon niet geladen worden: ${err.message}`, "error");
  }
}

/* ============================================================
   🌍 Sitemap redirect naar backend
   Zorgt dat https://irisje.nl/sitemap.xml altijd de backendversie toont
============================================================ */
app.get("/sitemap.xml", (req, res, next) => {
  if (req.hostname === "irisje.nl") {
    // 301 Permanent redirect zodat Google de juiste sitemap ziet
    return res.redirect(301, "https://irisje-backend.onrender.com/sitemap.xml");
  }
  next();
});

/* ============================================================
   ✅ Sitemap (moet vóór fallback staan)
============================================================ */
try {
  app.get("/sitemap.xml", require("./routes/sitemap"));
  addLog("Sitemap-route actief (/sitemap.xml)", "info");
} catch (err) {
  addLog("⚠️ Sitemap-route kon niet worden geladen: " + err.message, "error");
}

/* ============================================================
   ✅ Testroute
============================================================ */
app.get("/api/test", (req, res) => {
  addLog("API test uitgevoerd", "debug");
  res.json({ ok: true, message: "Server ziet routes correct" });
});

/* ============================================================
   🔍 Systeemcheck
============================================================ */
app.get("/api/check", (req, res) => {
  res.json({
    ok: true,
    routes: routes.map((r) => `/api/${r}`).concat(["/sitemap.xml"]),
    message: "✅ Alle routes zijn correct geladen en actief.",
  });
});

/* ============================================================
   🖼️ Slimme image-handler (WebP)
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
   🖼️ /img map
============================================================ */
app.use(
  "/img",
  express.static(path.join(__dirname, "../frontend/img"), {
    setHeaders: (res, filePath) => {
      if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      } else {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

/* ============================================================
   ✅ Frontend statische bestanden
============================================================ */
const frontendPath = path.join(__dirname, "../frontend");
app.use(
  express.static(frontendPath, {
    setHeaders: (res, filePath) => {
      if (/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      } else {
        res.setHeader("Cache-Control", "no-store");
      }
    },
  })
);

/* ============================================================
   🪄 HTML-optimalisatie (preload + lazyload)
============================================================ */
app.use(/.*\.html$/, (req, res, next) => {
  const filePath = path.join(frontendPath, req.path);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, "utf8");

  if (!html.includes("fonts.googleapis.com") && html.includes("<head>")) {
    const preloadBlock = `
    <!-- Injected performance preload -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preload" as="style" href="style.css?v=20251112">
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
   ✅ Frontend fallback (behalve .xml)
============================================================ */
app.get(/^\/(?!api\/|.*\.xml$).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* ============================================================
   🚀 Server starten
============================================================ */
const PORT = process.env.PORT || 3000;
startupBanner();
addLog(`Server gestart op poort ${PORT}`, "info");

app.listen(PORT, () => {
  addLog(`Server actief op poort ${PORT} (${process.env.NODE_ENV || "development"})`, "info");
});
