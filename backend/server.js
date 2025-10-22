// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

/* DB */
const MONGO_URI = process.env.MONGO_URI || "";
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err?.message || err));

/* Proxy (secure cookies op Render) */
app.set("trust proxy", 1);

/* CORS met credentials (frontend en domein toestaan) */
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
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Requested-With","Accept"]
};
app.use((req,res,next)=>{ res.header("Vary","Origin"); next(); });
app.options("/api/*", cors(corsOptions));
app.use(cors(corsOptions));

/* Body & Cookies */
app.use(express.json());
app.use(cookieParser());

/* Health */
app.get("/api/health", (_req,res)=> res.json({ ok:true, service:"api", ts:Date.now() }));
app.get("/api/auth/ping", (_req,res)=> res.json({ ok:true, service:"auth" }));

/* Routes */
const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews");
const companyRoutes = require("./routes/companies");
const adminRoutes = require("./routes/admin");
const publicRequestRoutes = require("./routes/publicRequests");
const emailRoutes = require("./routes/email");
const seedRoutes = require("./routes/seed"); // nieuw

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publicRequests", publicRequestRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/seed", seedRoutes);

/* (optioneel) statische frontend */
if (String(process.env.SERVE_FRONTEND || "").toLowerCase() === "true") {
  const frontendPath = path.join(__dirname, "../frontend");
  app.use(express.static(frontendPath));
  app.get("*", (_req,res)=> res.sendFile(path.join(frontendPath, "index.html")));
}

/* Error handler (o.a. CORS zichtbaar maken) */
app.use((err,_req,res,_next)=>{
  if (err && /CORS/.test(String(err))) {
    return res.status(403).json({ ok:false, error:"CORS", message: err.message || String(err) });
  }
  return res.status(500).json({ ok:false, error:"SERVER", message: err?.message || String(err) });
});

/* Start */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
