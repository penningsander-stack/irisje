// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import companyRoutes from "./routes/companies.js";
import requestRoutes from "./routes/requests.js";
import reviewRoutes from "./routes/review.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/reviews", reviewRoutes);

// Verbinding met MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ Fout bij verbinden MongoDB:", err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));

// Testroute
app.get("/", (req, res) => {
  res.send("Irisje backend actief ✅");
});
