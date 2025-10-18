// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const auth = require("../middleware/auth");

// Haal reviews van ingelogd bedrijf op
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json([]);

    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 });
    return res.json(reviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    return res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

// Publieke review insturen
router.post("/", async (req, res) => {
  try {
    const { name, rating, message, companyId } = req.body;
    if (!companyId) return res.status(400).json({ error: "Geen bedrijf opgegeven" });

    const review = new Review({
      name,
      rating,
      message,
      company: companyId,
    });

    await review.save();
    return res.json({ success: true, message: "Review toegevoegd" });
  } catch (err) {
    console.error("❌ Fout bij opslaan review:", err);
    return res.status(500).json({ error: "Serverfout bij opslaan review" });
  }
});

module.exports = router;
