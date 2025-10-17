// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "https://irisje-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ MongoDB-fout:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Root
app.get("/", (req, res) => res.send("Irisje backend actief"));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
