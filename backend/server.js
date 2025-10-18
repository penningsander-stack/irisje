// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

const app = express();

// CORS strak maar werkend voor jouw frontend
app.use(
  cors({
    origin: [
      "https://irisje-frontend.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Health/Root
app.get("/", (_, res) => res.send("Irisje backend actief ✅"));

// DB
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI ontbreekt in .env");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB-fout:", err);
    process.exit(1);
  });

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
