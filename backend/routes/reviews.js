// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// ✅ Alle reviews per bedrijf ophalen
router.get("/company/:companyId", async (req, res) => {
  try {
    const reviews = await Review.find({ companyId: req.params.companyId });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

// ✅ Nieuwe review toevoegen (publieke route)
router.post("/", async (req, res) => {
  try {
    const { companyId, name, rating, message } = req.body;
    if (!companyId || !name || !rating) {
      return res.status(400).json({ error: "Ontbrekende velden." });
    }

    const review = new Review({
      companyId,
      name,
      rating,
      message,
      reported: false,
      date: new Date(),
    });

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    console.error("Fout bij toevoegen review:", err);
    res.status(500).json({ error: "Serverfout bij toevoegen review." });
  }
});

// ✅ Review melden (bedrijf markeert review als verdacht)
router.patch("/:id/report", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: true },
      { new: true }
    );
    if (!review) return res.status(404).json({ error: "Review niet gevonden." });
    res.json({ success: true, message: "Review gemeld voor controle." });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

module.exports = router;
