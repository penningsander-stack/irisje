// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const auth = require("../middleware/auth");

// ✅ Alle reviews voor één bedrijf
router.get("/company/:companyId", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.companyId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij reviews ophalen:", err);
    res.status(500).json({ error: "Serverfout bij reviews ophalen" });
  }
});

module.exports = router;
