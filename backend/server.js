// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();

// ====== CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const FRONTEND_URL = "https://irisje-frontend.onrender.com";

// ====== MIDDLEWARE ======
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ====== ROUTES ======
app.use("/api/auth", authRoutes);

// ====== MONGODB CONNECTIE ======
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Verbonden met MongoDB"))
  .catch((err) => console.error("❌ Fout bij MongoDB:", err));

// ====== START SERVER ======
app.get("/", (req, res) => res.send("Irisje backend draait ✔️"));
app.listen(PORT, () => console.log(`🚀 Server actief op poort ${PORT}`));
