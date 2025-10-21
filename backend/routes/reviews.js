// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// ✅ Alle reviews van een bedrijf ophalen
router.get("/company/:companyId", async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.companyId });
    res.json(reviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

// ✅ Review melden
router.post("/report/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review niet gevonden." });
    }
    review.reported = true;
    await review.save();
    res.json({ success: true, message: "Review gemeld." });
  } catch (err) {
    console.error("❌ Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

// ✅ Gemelde reviews ophalen (voor admin-dashboard)
router.get("/reported", async (_, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true });
    res.json(reportedReviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen gemelde reviews." });
  }
});

// ✅ Review verwijderen (door beheerder)
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Review niet gevonden." });
    }
    res.json({ success: true, message: "Review verwijderd." });
  } catch (err) {
    console.error("❌ Fout bij verwijderen review:", err);
    res.status(500).json({ error: "Serverfout bij verwijderen review." });
  }
});

module.exports = router;
