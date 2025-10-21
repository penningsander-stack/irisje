// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// Alle reviews voor een specifiek bedrijf
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const reviews = await Review.find({ companyId }).sort({ date: -1 });
    return res.json(reviews || []);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    return res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

// Review melden (markeer als reported = true)
router.post("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Review.findByIdAndUpdate(
      id,
      { reported: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Review niet gevonden." });
    return res.json({ success: true, message: "Review gemeld voor controle." });
  } catch (err) {
    console.error("❌ Fout bij melden review:", err);
    return res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

// (Optioneel) seed endpoint voor dummy-reviews
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
    return res.json({ success: true, message: "✅ Dummy-reviews toegevoegd" });
  } catch (err) {
    console.error("❌ Seed-fout reviews:", err);
    return res.status(500).json({ error: "Seed-fout reviews." });
  }
});

module.exports = router;
