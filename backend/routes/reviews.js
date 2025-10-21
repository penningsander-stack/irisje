// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// Alle reviews voor een specifiek bedrijf
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const reviews = await Review.find({ companyId, reported: false }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

// Review melden (bedrijfskant)
router.post("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { reported: true }, { new: true });
    if (!review) return res.status(404).json({ error: "Review niet gevonden." });
    res.json({ success: true, message: "Review gemeld voor controle." });
  } catch (err) {
    console.error("❌ Fout bij melden review:", err);
    res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

// Gemelde reviews (beheerder)
router.get("/reported", async (_req, res) => {
  try {
    const reported = await Review.find({ reported: true }).sort({ date: -1 });
    res.json(reported);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen gemelde reviews." });
  }
});

// (Test) dummy-reviews
router.get("/seed", async (_req, res) => {
  try {
    const companyId = "68f4c355ab9e361a51d29acd";
    await Review.deleteMany({ companyId });
    await Review.insertMany([
      {
        companyId,
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        date: new Date("2025-10-05"),
      },
      {
        companyId,
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        date: new Date("2025-10-08"),
      },
    ]);
    res.json({ success: true, message: "✅ Dummy-reviews toegevoegd" });
  } catch (err) {
    console.error("❌ Seed-fout reviews:", err);
    res.status(500).json({ error: "Seed-fout reviews." });
  }
});

module.exports = router;
