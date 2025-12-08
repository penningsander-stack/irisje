// backend/server.js – corrected and optimized for Irisje.nl (v20251208)

const express = require("express");
const path = require("path");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

// ROUTES
app.use("/api/publicRequests", require("./routes/publicRequests")); 
app.use("/api/companies", require("./routes/companies"));
app.use("/api/requests", require("./routes/requests"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/email", require("./routes/email"));
app.use("/api/payments", require("./routes/payments"));

// STATIC FRONTEND
app.use(express.static(path.join(__dirname, "..", "frontend")));

// SPA FALLBACK
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
