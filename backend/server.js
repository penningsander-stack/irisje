// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews"); // let op: meervoud
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Verbinding met MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ Fout bij verbinden MongoDB:", err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));

// Test-endpoint
app.get("/", (_req, res) => {
  res.send("Irisje backend actief ✅");
});
