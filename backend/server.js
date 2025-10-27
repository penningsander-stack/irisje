// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// === ✅ CORS FIX (betere compatibiliteit met Render + Gmail deploy) ===
const allowedOrigins = [
  "https://irisje.nl",
  "https://www.irisje.nl",
  "https://irisje-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("❌ Geblokkeerde CORS-origin:", origin);
        callback(new Error("Niet-toegestane bron: " + origin));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database connectie
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/companies", require(__dirname + "/routes/companies.js"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/publicRequests", require("./routes/publicRequests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/seed", require("./routes/seed"));

// Test- en fallbackroutes
app.get("/", (req, res) => res.send("🌐 Irisje.nl backend actief"));
app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "Server ziet routes correct" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
