// backend/server.js
import "./config/validateEnv.js"; // ✅ controleert alle vereiste .env-velden
import { startupBanner } from "./utils/logHelper.js"; // 🌸 nette logs

import express from "express";
import mongoose from "mongoose";
import compression from "compression";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// 🌸 Nieuwe centrale beveiligingsconfiguratie
import { corsMiddleware, securityHeaders } from "./config/security.js";
// 🌸 Logger (voor status-overzicht)
import { addLog } from "./utils/logger.js";

// 🌍 Routes
import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/companies.js";
import requestRoutes from "./routes/requests.js";
import publicRequestsRoutes from "./routes/publicRequests.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";
import emailRoutes from "./routes/email.js";
import paymentsRoutes from "./routes/payments.js";
import statusRoutes from "./routes/status.js";
import claimsRoutes from "./routes/claims.js";
import seedRoutes from "./routes/seed.js";
import importerRoutes from "./routes/importer_places.js";
import googleReviewsRoutes from "./routes/googleReviews.js";

// ES module equivalents van __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env laden
dotenv.config();

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

// === ✅ API-routes ===
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/publicRequests", publicRequestsRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/google-reviews", googleReviewsRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/importer", importerRoutes);

// === ✅ Testroute — vóór frontend fallback ===
app.get("/api/test", (req, res) => {
  addLog("API test uitgevoerd", "debug");
  res.json({ ok: true, message: "Server ziet routes correct" });
});

// === 🖼️ Slimme image-serve middleware (WebP-detectie) ===
app.get(/\.(jpg|jpeg|png)$/i, (req, res, next) => {
  const originalPath = path.join(__dirname, "../frontend", req.path);
  const webpPath = originalPath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const acceptsWebp =
    req.headers.accept && req.headers.accept.includes("image/webp");

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

// === 🪄 HTML-head & lazyload + status-enhanced injectie ===
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
    html = html.replace(
      /<\/body>/i,
      `  <script src="js/lazyload.js"></script>\n</body>`
    );
  }

  // 🌸 Extra: status-enhanced.js automatisch injecteren op statuspagina
  if (req.path === "/status.html" && !html.includes("js/status-enhanced.js")) {
    html = html.replace(
      /<\/body>/i,
      `  <script src="js/status-enhanced.js"></script>\n</body>`
    );
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
addLog("Server gestart op poort " + PORT, "info");

app.listen(PORT, () => {
  console.log(
    `🌸 [Irisje] 🚀 Server running on port ${PORT} (${process.env.NODE_ENV || "development"})`
  );
});
