// backend/server.js
// v20260102-STATIC-FRONTEND-ABSOLUTE-FIX
//
// Fix:
// - Frontend statisch serveren met absoluut pad
// - Werkt op Render waar service vanuit /backend draait
// - /style.css wordt correct geserveerd

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// --------------------
// CORS
// --------------------
const ALLOWED_ORIGINS = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked: " + origin));
    },
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", cors());

// --------------------
// Middleware
// --------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// --------------------
// Database
// --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --------------------
// STATIC FILES (DE JUISTE FIX)
// --------------------

// backend → ../frontend (absoluut & betrouwbaar)
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_PATH));

// --------------------
// API Routes
// --------------------
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/publicRequests", require("./routes/publicRequests"));

// --------------------
// Health
// --------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// --------------------
// Error handler
// --------------------
app.use((err, req, res, next) => {
  if (err?.message?.startsWith("CORS blocked")) {
    return res.status(403).json({ ok: false, error: err.message });
  }
  console.error("Server error:", err);
  res.status(500).json({ ok: false, error: "Server error" });
});

// --------------------
// Start
// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
