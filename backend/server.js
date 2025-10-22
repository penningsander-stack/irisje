// backend/server.js
// ======================================
// Irisje.nl - Backend hoofdserver (stabiele versie)
// ======================================

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// ---------------------
// ✅ CORS-instellingen
// ---------------------
app.use(
  cors({
    origin: [
      "https://irisje-frontend.onrender.com",
      "https://www.irisje-frontend.onrender.com"
    ],
    credentials: true, // belangrijk voor sessie-cookies
  })
);

// ---------------------
// Middleware
// ---------------------
app.use(express.json());
app.use(cookieParser());

// ---------------------
// Databaseverbinding
// ---------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---------------------
// Routes
// ---------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/companies", require("./routes/companies"));
app.use("/api/email", require("./routes/email"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/seed", require("./routes/seed"));

// ---------------------
// Test & status routes
// ---------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.get("/api/auth/ping", (req, res) => {
  res.json({ ok: true, service: "auth" });
});

// ---------------------
// Server starten
// ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
