// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// ✅ Alle gemelde reviews ophalen
router.get("/reported-reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen gemelde reviews." });
  }
});

// ✅ Review goedkeuren (melding verwijderen)
router.patch("/reviews/:id/approve", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: false },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: "Review niet gevonden." });
    res.json({ success: true, message: "Review goedgekeurd." });
  } catch (err) {
    console.error("Fout bij goedkeuren review:", err);
    res.status(500).json({ error: "Serverfout bij goedkeuren review." });
  }
});

// ✅ Review verwijderen
router.delete("/reviews/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: "Review niet gevonden." });
    res.json({ success: true, message: "Review verwijderd." });
  } catch (err) {
    console.error("Fout bij verwijderen review:", err);
    res.status(500).json({ error: "Serverfout bij verwijderen review." });
  }
});

module.exports = router;
