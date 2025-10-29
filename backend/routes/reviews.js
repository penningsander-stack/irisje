// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

// ✅ Alle reviews ophalen (alleen test/doeleinden)
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
      date: new Date(),
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

// ✅ Reviews ophalen per bedrijf
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews per bedrijf:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

// ✅ Nieuw: Gemelde reviews ophalen (voor adminpagina)
router.get("/reported", async (req, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true }).sort({ createdAt: -1 });
    res.json(reportedReviews);
  } catch (err) {
    console.error("Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ message: "Serverfout bij ophalen gemelde reviews" });
  }
});

module.exports = router;
