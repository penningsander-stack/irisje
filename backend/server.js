// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

/* ────────────────────────────────
   1. DATABASE
   ──────────────────────────────── */
const MONGO_URI = process.env.MONGO_URI || "";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err?.message || err));

/* ────────────────────────────────
   2. TRUST PROXY (Render cookies)
   ──────────────────────────────── */
app.set("trust proxy", 1);

/* ────────────────────────────────
   3. CORS met credentials
   ──────────────────────────────── */
const ALLOWED_ORIGINS = [
  "https://irisje-frontend.onrender.com",
  "https://irisje.nl"
];
function originChecker(origin, cb) {
  if (!origin) return cb(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
  return cb(new Error(`CORS blocked for origin: ${origin}`));
}
const corsOptions = {
  origin: originChecker,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};
app.use((req, res, next) => {
  res.header("Vary", "Origin");
  next();
});
app.options("/api/*", cors(corsOptions));
app.use(cors(corsOptions));

/* ────────────────────────────────
   4. BODY & COOKIES
   ──────────────────────────────── */
app.use(express.json());
app.use(cookieParser());

/* ────────────────────────────────
   5. HEALTH
   ──────────────────────────────── */
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/api/auth/ping", (_req, res) => res.json({ ok: true, service: "auth" }));

/* ────────────────────────────────
   6. ROUTES
   ──────────────────────────────── */
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");
const publicRequestRoutes = require("./routes/publicRequests");
const emailRoutes = require("./routes/email");
const seedRoutes = require("./routes/seed");
const fixDemoRoutes = require("./routes/fixDemo");


app.use("/api/fix", fixDemoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publicRequests", publicRequestRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/seed", seedRoutes);

/* ────────────────────────────────
   7. (OPTIONEEL) STATIC FRONTEND
   ──────────────────────────────── */
if (String(process.env.SERVE_FRONTEND || "").toLowerCase() === "true") {
  const frontendPath = path.join(__dirname, "../frontend");
  app.use(express.static(frontendPath));
  app.get("*", (_req, res) => res.sendFile(path.join(frontendPath, "index.html")));
}

/* ────────────────────────────────
   8. ERROR HANDLER
   ──────────────────────────────── */
app.use((err, _req, res, _next) => {
  if (err && /CORS/.test(String(err))) {
    return res.status(403).json({ ok: false, error: "CORS", message: err.message });
  }
  console.error("Server error:", err);
  return res.status(500).json({ ok: false, error: "SERVER", message: err.message });
});

/* ────────────────────────────────
   9. START
   ──────────────────────────────── */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
