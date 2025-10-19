// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const auth = require("../middleware/auth");

// ✅ Reviews ophalen voor ingelogd bedrijf
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user?.id;
    if (!companyId) return res.status(400).json({ error: "Geen bedrijf-ID gevonden." });

    // Probeer echte reviews op te halen
    const reviews = await Review.find({ companyId });

    // Als er geen reviews zijn, dummydata teruggeven
    if (!reviews.length) {
      return res.json([
        {
          _id: "rev1",
          name: "Klant A",
          rating: 5,
          message: "Super vriendelijk geholpen!",
          date: new Date("2025-10-05"),
        },
        {
          _id: "rev2",
          name: "Klant B",
          rating: 4,
          message: "Goede communicatie en snelle service.",
          date: new Date("2025-10-08"),
        },
      ]);
    }

    res.json(reviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews:", err);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

module.exports = router;
