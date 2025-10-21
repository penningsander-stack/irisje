// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// ✅ Imports van alle routes
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");
const seedRoutes = require("./routes/seed"); // toegevoegd

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ API-routes koppelen
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seed", seedRoutes); // toegevoegd

// ✅ Verbinding met MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ MongoDB-fout:", err));

// ✅ Root testendpoint
app.get("/", (_, res) => {
  res.send("Irisje backend actief ✅");
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
