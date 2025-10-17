// backend/routes/reviews.js
const express = require("express");
const jwt = require("jsonwebtoken");
const Review = require("../models/review"); // let op: kleine letter
const router = express.Router();

// Middleware om token te controleren
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Geen token meegegeven" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch {
    return res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
}

// ✅ Reviews ophalen van ingelogd bedrijf
router.get("/list", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.companyId }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Review melden (bedrijf kan review markeren als 'gemeld')
router.put("/report/:id", verifyToken, async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { reported: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review" });
  }
});

module.exports = router;
