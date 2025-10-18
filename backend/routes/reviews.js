// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const auth = require("../middleware/auth");

router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("❌ Fout bij ophalen reviews:", error);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, rating, message, companyId } = req.body;
    const review = new Review({ name, rating, message, company: companyId });
    await review.save();
    res.json({ success: true, message: "Review toegevoegd" });
  } catch (error) {
    console.error("❌ Fout bij opslaan review:", error);
    res.status(500).json({ error: "Serverfout bij opslaan review" });
  }
});

module.exports = router;
