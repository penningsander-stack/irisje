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

// === ✅ CORS FIX (Render + productiecompatibiliteit) ===
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Geblokkeerde CORS-origin:", origin);
        callback(new Error("Niet-toegestane bron: " + origin));
      }
    },
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
  console.error("❌ Geen MongoDB URI gevonden in environment variabelen");
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

// === 🪄 Automatisch lazyload.js injecteren ===
app.use(/.*\.html$/, (req, res, next) => {
  const filePath = path.join(__dirname, "../frontend", req.path);
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, "utf8");
    if (!html.includes("js/lazyload.js")) {
      html = html.replace(
        /<\/body>/i,
        `  <script src="js/lazyload.js"></script>\n</body>`
      );
    }
    res.type("html").send(html);
  } else {
    next();
  }
});

// === ✅ Frontend fallback (Express 5-compatibel) ===
app.use(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// === ✅ Start server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`)
);
