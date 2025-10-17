// backend/server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Routes importeren
const { router: authRoutes } = require("./routes/auth");
const secureRoutes = require("./routes/secure");
const requestRoutes = require("./routes/requests");
const publicRequestRoutes = require("./routes/publicRequests");

// ✅ Routes activeren
app.use("/api/auth", authRoutes);
app.use("/api/secure", secureRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/public", publicRequestRoutes);

// ✅ Database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB fout:", err));

// ✅ Server starten
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server draait op poort ${PORT}`));
