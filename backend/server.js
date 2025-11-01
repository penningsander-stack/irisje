// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// === ✅ CORS FIX ===
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com"
];
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || allowedOrigins.includes(origin)
        ? cb(null, true)
        : cb(new Error("Niet-toegestane bron: " + origin)),
    credentials: true
  })
);

// === ✅ Middleware ===
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(compression());

// 🚫 Cachebeleid
app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (/\.(css|js|png|jpg|jpeg|svg|webp|ico)$/i.test(req.path)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// === ✅ Database connectie ===
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ Geen MongoDB URI gevonden");
  process.exit(1);
}
mongoose
  .connect(uri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

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

// === ✅ Statische frontend-bestanden ===
app.use(express.static(path.join(__dirname, "../frontend")));

// === 🪄 Automatisch head- én lazyload-injectie ===
app.use(/.*\.html$/, (req, res, next) => {
  const filePath = path.join(__dirname, "../frontend", req.path);
  if (!fs.existsSync(filePath)) return next();

  let html = fs.readFileSync(filePath, "utf8");

  // 🔹 Injecteer preload-head-sectie als nog niet aanwezig
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

  // 🔹 Injecteer lazyload-script indien niet aanwezig
  if (!html.includes("js/lazyload.js")) {
    html = html.replace(/<\/body>/i, `  <script src="js/lazyload.js"></script>\n</body>`);
  }

  res.type("html").send(html);
});

// === ✅ Frontend fallback ===
app.use(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// === ✅ Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`)
);
