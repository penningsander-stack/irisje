// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const auth = require("../middleware/auth");

// 📋 Reviews ophalen voor ingelogd bedrijf
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

// 🚨 Review melden
router.patch("/report/:id", auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review niet gevonden" });

    review.reported = true;
    await review.save();
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review" });
  }
});

module.exports = router;
