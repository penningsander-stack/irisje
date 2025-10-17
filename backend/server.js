// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const reviewsRoutes = require("./routes/reviews");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const requestsRoutes = require("./routes/requests");

dotenv.config();
const app = express();

// Middleware
app.use("/api/reviews", reviewsRoutes);

app.use(express.json());
app.use(
  cors({
    origin: "https://irisje-frontend.onrender.com",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// MongoDB-verbinding
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ MongoDB-fout:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/requests", requestsRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("🌐 Irisje backend actief en verbonden met MongoDB");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
