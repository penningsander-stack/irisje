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
const autoSeed = require("./utils/autoSeed"); // 🌱 automatische testdata

const app = express();
app.use(cors());
app.use(express.json());

// API-routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Testendpoint
app.get("/", (_, res) => res.send("Irisje backend actief ✅"));

// Verbinding met database + server starten
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Verbonden met MongoDB");

    // 🌱 Auto-seed uitvoeren
    await autoSeed().catch((e) =>
      console.error("❌ Auto-seed crashte:", e)
    );

    app.listen(PORT, () => {
      console.log(`🚀 Server actief op poort ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB-fout:", err);
    process.exit(1);
  });
