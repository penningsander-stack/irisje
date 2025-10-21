// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const reviews = await Review.find({ companyId });
    if (!reviews.length) {
      return res.json([]);
    }
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

module.exports = router;
