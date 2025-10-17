// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth.js");

dotenv.config();

const app = express();

// ===== CONFIGURATIE =====
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = "https://irisje-frontend.onrender.com";

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ===== ROUTES =====
app.use("/api/auth", authRoutes);

// ===== TESTROUTE =====
app.get("/", (req, res) => res.send("✅ Irisje backend draait goed"));

// ===== MONGODB =====
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ Fout bij MongoDB:", err));

// ===== START SERVER =====
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
