// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// GET: alle gemelde reviews ophalen
router.get("/reported-reviews", async (req, res) => {
  try {
    const reported = await Review.find({ reported: true }).sort({ createdAt: -1 });
    res.json(reported);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ message: "Fout bij laden reviews" });
  }
});

// PATCH: gemelde review markeren als bekeken (of verwijderen)
router.patch("/resolve/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: false },
      { new: true }
    );
    if (!review) return res.status(404).json({ message: "Review niet gevonden" });
    res.json({ message: "Gemelde review afgehandeld", review });
  } catch (err) {
    console.error("❌ Fout bij bijwerken review:", err);
    res.status(500).json({ message: "Fout bij bijwerken review" });
  }
});

module.exports = router;
