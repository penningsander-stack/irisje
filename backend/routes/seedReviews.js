// backend/routes/seedReviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const User = require("../models/User");

router.get("/demo", async (req, res) => {
  try {
    // Zoek demo-bedrijf
    const demoUser = await User.findOne({ email: "demo@irisje.nl" });
    if (!demoUser) {
      return res.status(404).json({ error: "Demo-gebruiker niet gevonden." });
    }

    // Oude testreviews verwijderen
    await Review.deleteMany({ companyId: demoUser._id });

    // Nieuwe testreviews toevoegen
    const testReviews = [
      {
        name: "Klant A",
        rating: 5,
        message: "Super vriendelijk geholpen!",
        companyId: demoUser._id,
        date: new Date("2025-10-05"),
      },
      {
        name: "Klant B",
        rating: 4,
        message: "Goede communicatie en snelle service.",
        companyId: demoUser._id,
        date: new Date("2025-10-08"),
      },
    ];

    await Review.insertMany(testReviews);

    res.json({
      success: true,
      message: "✅ Testreviews toegevoegd aan database.",
      count: testReviews.length,
    });
  } catch (err) {
    console.error("❌ Fout bij seeden reviews:", err);
    res.status(500).json({ error: "Seed-fout reviews", details: err.message });
  }
});

module.exports = router;
