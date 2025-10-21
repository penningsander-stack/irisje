// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");

// 📥 Alle reviews voor een specifiek bedrijf ophalen
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const reviews = await Review.find({ companyId });

    if (!reviews || reviews.length === 0) {
      return res.json([]);
    }

    res.json(reviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

// 🧱 Testroute om snel dummy-reviews toe te voegen (optioneel)
router.get("/seed", async (req, res) => {
  try {
    await Review.deleteMany({});
    await Review.insertMany([
      {
        companyId: "68f4c355ab9e361a51d29acd",
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        date: new Date("2025-10-05")
      },
      {
        companyId: "68f4c355ab9e361a51d29acd",
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        date: new Date("2025-10-08")
      }
    ]);
    res.json({ success: true, message: "✅ Dummy-reviews toegevoegd" });
  } catch (err) {
    console.error("❌ Seed-fout:", err);
    res.status(500).json({ error: "Seed-fout bij reviews." });
  }
});

module.exports = router;
