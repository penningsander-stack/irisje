// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import publicRequestsRoutes from "./routes/publicRequests.js";
import companiesRoutes from "./routes/companies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(express.json());

/* =========================
   Database
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* =========================
   API Routes
========================= */
app.use("/api/publicRequests", publicRequestsRoutes);
app.use("/api/companies", companiesRoutes);

/* =========================
   FRONTEND STATIC FILES
========================= */
const FRONTEND_PATH = path.join(__dirname, "../frontend");

// Normale root ( / )
app.use(express.static(FRONTEND_PATH));

// 🔥 CRUCIAAL: /css → frontend
app.use("/css", express.static(FRONTEND_PATH));

// fallback voor html
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* =========================
   Server start
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server draait op poort ${PORT}`);
});
