// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

// ✅ Alle reviews ophalen (optioneel, voor test)
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().lean();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Nieuwe review toevoegen
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, rating, message } = req.body;
    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    const newReview = new Review({
      company: company._id,
      name,
      email,
      rating,
      message,
      date: new Date(),           // 👈 datum wordt nu altijd toegevoegd
    });
    await newReview.save();

    // Update bedrijfsstatistieken
    const reviews = await Review.find({ company: company._id });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    company.avgRating = avg;
    company.reviewCount = reviews.length;
    await company.save();

    res.json({ message: "Review toegevoegd", review: newReview });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout bij opslaan review" });
  }
});

module.exports = router;
