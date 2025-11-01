// backend/server.js
require("./config/validateEnv"); // ✅ controleert alle vereiste .env-velden
const { startupBanner } = require("./utils/logHelper"); // 🌸 nette logs

const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// 🌸 Nieuwe centrale beveiligingsconfiguratie
const { corsMiddleware, securityHeaders } = require("./config/security");

const app = express();

// === ✅ Basis middleware ===
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(compression());
app.use(corsMiddleware);
app.use(securityHeaders);

// === ✅ MongoDB connectie ===
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("🌸 [FOUT] Geen MongoDB URI gevonden");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => console.log("🌸 [Irisje] ✅ MongoDB connected"))
  .catch((err) => console.error("🌸 [FOUT] MongoDB error:", err.message));

// === ✅ API-routes ===
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/seed", require("./routes/seed"));

// === ✅ Testroute — vóór frontend fallback ===
app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "Server ziet routes correct" });
});

// === 🖼️ Slimme image-serve middleware (WebP-detectie) ===
app.get(/\.(jpg|jpeg|png)$/i, (req, res, next) => {
  const originalPath = path.join(__dirname, "../frontend", req.path);
  const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const acceptsWebp = req.headers.accept && req.headers.accept.includes("image/webp");

  if (acceptsWebp && fs.existsSync(webpPath)) {
    res.sendFile(webpPath);
  } else if (fs.existsSync(originalPath)) {
    res.sendFile(originalPath);
  } else {
    next();
  }
});

// === ✅ Statische frontend-bestanden ===
app.use(express.static(path.join(__dirname, "../frontend")));

// === 🪄 HTML-head & lazyload injectie ===
app.use(/.*\.html$/, (req, res, next) => {
  const filePath = path.join(__dirname, "../frontend", req.path);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, "utf8");

  // Fonts & preload alleen injecteren als ze nog ontbreken
  if (!html.includes("fonts.googleapis.com") && html.includes("<head>")) {
    const preloadBlock = `
    <!-- Injected performance preload -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="preload" as="style" href="style.css?v=20251030">
    <link rel="preload" as="image" href="favicon.ico">
    `;
    html = html.replace(/<head>/i, `<head>${preloadBlock}`);
  }

  // lazyload.js correct toevoegen (kleine letters!)
  if (!html.includes("js/lazyload.js")) {
    html = html.replace(/<\/body>/i, `  <script src="js/lazyload.js"></script>\n</body>`);
  }

  res.type("html").send(html);
});

// === ✅ Frontend fallback (alle niet-API routes) ===
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// === ✅ Server starten ===
const PORT = process.env.PORT || 3000;
startupBanner();

app.listen(PORT, () => {
  console.log(`🌸 [Irisje] 🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
