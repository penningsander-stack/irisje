// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

/* === Alle reviews ophalen (voor test/doeleinden) === */
router.get("/", async (req, res) => {
  try {
    const { slug } = req.query;

    // 🔍 Als er een slug is meegegeven, reviews van dat specifieke bedrijf
    if (slug) {
      const company = await Company.findOne({ slug }).lean();
      if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

      const reviews = await Review.find({ company: company._id })
        .sort({ createdAt: -1 })
        .lean();

      return res.json(
        reviews.map((r) => ({
          name: r.name || "Anoniem",
          rating: r.rating || 0,
          message: r.message || "",
          date: r.createdAt || r.date || null,
        }))
      );
    }

    // Anders: alle reviews teruggeven
    const allReviews = await Review.find().lean();
    res.json(allReviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ message: "Serverfout bij ophalen reviews" });
  }
});

/* === Nieuwe review toevoegen === */
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, rating, message } = req.body;

    if (!companySlug || !rating || !message) {
      return res.status(400).json({ message: "Onvolledige gegevens" });
    }

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    const newReview = new Review({
      company: company._id,
      name: name?.trim() || "Anoniem",
      email: email?.trim() || "",
      rating: Number(rating) || 0,
      message: message?.trim() || "",
      createdAt: new Date(),
      reported: false,
    });

    await newReview.save();

    // Gemiddelde waardering en aantal reviews bijwerken
    const reviews = await Review.find({ company: company._id });
    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    company.avgRating = avg;
    company.reviewCount = reviews.length;
    await company.save();

    res.json({
      ok: true,
      message: "Review toegevoegd",
      review: {
        name: newReview.name,
        rating: newReview.rating,
        message: newReview.message,
        date: newReview.createdAt,
      },
    });
  } catch (err) {
    console.error("Fout bij opslaan review:", err);
    res.status(500).json({ message: "Serverfout bij opslaan review" });
  }
});

/* === Reviews ophalen per bedrijf (via ID, voor intern gebruik) === */
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (err) {
    console.error("Fout bij ophalen reviews per bedrijf:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

/* === Gemelde reviews ophalen (voor adminpagina) === */
router.get("/reported", async (req, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true }).sort({ createdAt: -1 }).lean();
    res.json(reportedReviews);
  } catch (err) {
    console.error("Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ message: "Serverfout bij ophalen gemelde reviews" });
  }
});

/* === Review melden === */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ message: "Review niet gevonden" });

    review.reported = true;
    await review.save();

    res.json({ message: "Review gemeld", review });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ message: "Serverfout bij melden review" });
  }
});

module.exports = router;
