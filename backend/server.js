// backend/server.js
// ✅ Volledige backend-server voor Irisje (bedrijven + klantaanvragen)

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// 🌍 Middleware
app.use(cors());
app.use(express.json());

// 🧩 Routes importeren
const { router: authRoutes } = require("./routes/auth");
const secureRoutes = require("./routes/secure");
const requestRoutes = require("./routes/requests");
const publicRequestRoutes = require("./routes/publicRequests");

// 📦 Routes activeren
app.use("/api/auth", authRoutes);         // Inloggen + token
app.use("/api/secure", secureRoutes);     // Beveiligde bedrijfsinfo
app.use("/api/requests", requestRoutes);  // Dashboard-aanvragen
app.use("/api/public", publicRequestRoutes); // Publieke aanvragen

// ⚙️ Database verbinden
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connectie fout:", err));

// 🚀 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server is running on port ${PORT}`));
