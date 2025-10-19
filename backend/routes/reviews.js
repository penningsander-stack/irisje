const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

router.get("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const reviews = await Review.find({ companyId }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

module.exports = router;
