// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

/* 1) Proxy-instelling (Render gebruikt reverse proxy) */
app.set("trust proxy", 1);

/* 2) CORS – alleen frontend-domein toestaan */
const ALLOWED_ORIGINS = ["https://irisje-frontend.onrender.com"];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

/* 3) Body-parser & cookies */
app.use(express.json());
app.use(cookieParser());

/* 4) Databaseverbinding */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err?.message || err));

/* 5) Health-checks */
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/api/auth/ping", (_req, res) =>
  res.json({ ok: true, service: "auth" })
);

/* 6) Routes */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/email", require("./routes/email"));
app.use("/api/fix", require("./routes/fixDemo"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/seed", require("./routes/seed"));
app.use("/api/seedRequests", require("./routes/seedRequests"));
app.use("/api/seedReviews", require("./routes/seedReviews"));
app.use("/api/testRequests", require("./routes/testRequests"));
app.use("/api/secure", require("./routes/secure"));

/* 7) Optioneel: frontend mee-serveren */
if (String(process.env.SERVE_FRONTEND || "").toLowerCase() === "true") {
  const frontendPath = path.join(__dirname, "../frontend");
  app.use(express.static(frontendPath));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(frontendPath, "index.html"))
  );
}

/* 8) Fallback-error-handler */
app.use((err, _req, res, _next) => {
  if (err && /CORS/.test(String(err))) {
    return res
      .status(403)
      .json({ ok: false, error: "CORS", message: err.message });
  }
  console.error("Server error:", err);
  return res.status(500).json({
    ok: false,
    error: "SERVER",
    message: err?.message || "Server error",
  });
});

/* 9) Server starten */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
