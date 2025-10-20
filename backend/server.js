// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes importeren
const authRoutes = require("./routes/auth");
const companyRoutes = require("./routes/companies");
const requestRoutes = require("./routes/requests");
const reviewRoutes = require("./routes/reviews");
const adminRoutes = require("./routes/admin");

// ✅ Nieuw toegevoegd — seed-routes
const seedRequestsRoutes = require("./routes/seedRequests");
const seedReviewsRoutes = require("./routes/seedReviews");

const app = express();
app.use(cors());
app.use(express.json());

// Routes activeren
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Nieuw toegevoegd — seed endpoints
app.use("/api/seed", seedRequestsRoutes);
app.use("/api/seed", seedReviewsRoutes);

// MongoDB-verbinding
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ MongoDB-fout:", err));

// Basisroute
app.get("/", (_, res) => res.send("Irisje backend actief ✅"));

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
