// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

/* === Alle reviews ophalen (voor test/doeleinden) === */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().lean();
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Serverfout bij ophalen reviews" });
  }
});

/* === Nieuwe review toevoegen === */
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, rating, message } = req.body;
    const company = await Company.findOne({ slug: companySlug });

    if (!company) {
      return res.status(404).json({ ok: false, message: "Bedrijf niet gevonden" });
    }

    const newReview = new Review({
      company: company._id,
      name,
      email,
      rating,
      message,
      date: new Date(),
      reported: false,
    });

    await newReview.save();

    // Gemiddelde waardering en aantal reviews bijwerken
    const reviews = await Review.find({ company: company._id }).sort({ date: -1 });
    const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

    company.avgRating = avg;
    company.reviewCount = reviews.length;
    await company.save();

    res.json({
      ok: true,
      message: "Review toegevoegd",
      review: newReview,
      reviews, // ✨ Stuur meteen alle actuele reviews terug
      avgRating: company.avgRating,
      reviewCount: company.reviewCount,
    });
  } catch (err) {
    console.error("❌ Fout bij opslaan review:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij opslaan review" });
  }
});

/* === Reviews ophalen per bedrijf === */
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ date: -1 });
    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("Fout bij ophalen reviews per bedrijf:", err);
    res.status(500).json({ ok: false, error: "Serverfout" });
  }
});

/* === Gemelde reviews ophalen (voor adminpagina) === */
router.get("/reported", async (req, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true }).sort({ date: -1 });
    res.json({ ok: true, reportedReviews });
  } catch (err) {
    console.error("Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij ophalen gemelde reviews" });
  }
});

/* === Nieuw: Review melden === */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ ok: false, message: "Review niet gevonden" });
    }

    review.reported = true;
    await review.save();

    res.json({ ok: true, message: "Review gemeld", review });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij melden review" });
  }
});

module.exports = router;
