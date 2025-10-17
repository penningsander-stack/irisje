// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ===== Routes =====
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Testroute
app.get("/", (req, res) => {
  res.send("✅ Irisje Backend actief");
});

// ===== Verbinding met MongoDB =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Verbonden met MongoDB");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB-verbinding mislukt:", err));
