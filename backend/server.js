// backend/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Routes
const publicRequestsRoutes = require("./routes/publicRequests");
const companiesRoutes = require("./routes/companies");

const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   Database
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* =========================
   API routes
========================= */
app.use("/api/publicRequests", publicRequestsRoutes);
app.use("/api/companies", companiesRoutes);

/* =========================
   Frontend static files
========================= */
const FRONTEND_PATH = path.join(__dirname, "../frontend");

// Root static ( /style.css, /select-companies.html, etc.)
app.use(express.static(FRONTEND_PATH));

// 🔥 CRUCIAAL: support voor /css/style.css
app.use("/css", express.static(FRONTEND_PATH));

/* =========================
   HTML fallback
========================= */
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* =========================
   Server start
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server draait op poort ${PORT}`);
});
