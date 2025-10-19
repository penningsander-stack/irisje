// backend/routes/reviews.js
const express = require("express");
const auth = require("../middleware/auth");
const Review = require("../models/review");

const router = express.Router();

// ✅ Haal reviews van het ingelogde bedrijf op
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Geen bedrijf gekoppeld aan gebruiker" });

    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 }).lean();
    return res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Review melden
router.post("/:id/report", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review niet gevonden" });

    review.reported = true;
    await review.save();

    res.json({ message: "Review gemeld" });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review" });
  }
});

module.exports = router;
