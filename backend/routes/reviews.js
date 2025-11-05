// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const Company = require("../models/Company");

/* === 🔍 Alle reviews ophalen (voor test/doeleinden) === */
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 }).lean();
    res.json({ ok: true, total: reviews.length, reviews });
  } catch (err) {
    console.error("❌ Fout bij ophalen alle reviews:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij ophalen reviews" });
  }
});

/* === ✍ Nieuwe review toevoegen === */
router.post("/", async (req, res) => {
  try {
    const { companySlug, name, email, rating, message } = req.body;

    // 🔎 Bedrijf zoeken
    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({ ok: false, message: "Bedrijf niet gevonden" });
    }

    // 🆕 Nieuwe review opslaan
    const newReview = new Review({
      company: company._id,
      name: name?.trim() || "Anoniem",
      email: email?.trim() || "",
      rating: Number(rating) || 0,
      message: message?.trim() || "",
      date: new Date(),
      reported: false,
    });
    await newReview.save();

    // 🔄 Gemiddelde waardering bijwerken
    const allReviews = await Review.find({ company: company._id }).sort({ date: -1 });
    const avg =
      allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length || 0;

    company.avgRating = Math.round(avg * 10) / 10;
    company.reviewCount = allReviews.length;
    await company.save();

    res.json({
      ok: true,
      message: "Review toegevoegd",
      review: newReview,
      reviews: allReviews,
      avgRating: company.avgRating,
      reviewCount: company.reviewCount,
    });
  } catch (err) {
    console.error("❌ Fout bij opslaan review:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij opslaan review" });
  }
});

/* === 🏢 Reviews ophalen per bedrijf-ID === */
router.get("/company/:companyId", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    const reviews = await Review.find({ company: companyId }).sort({ date: -1 }).lean();
    res.json({ ok: true, total: reviews.length, reviews });
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews per bedrijf:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij ophalen reviews" });
  }
});

/* === 🆔 Reviews ophalen per bedrijf-slug (extra handig voor frontend) === */
router.get("/slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const company = await Company.findOne({ slug });
    if (!company) {
      return res.status(404).json({ ok: false, message: "Bedrijf niet gevonden" });
    }

    const reviews = await Review.find({ company: company._id }).sort({ date: -1 }).lean();
    res.json({
      ok: true,
      company: company.name,
      total: reviews.length,
      reviews,
      avgRating: company.avgRating || 0,
      reviewCount: company.reviewCount || reviews.length,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen reviews via slug:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij ophalen reviews" });
  }
});

/* === 🚩 Gemelde reviews ophalen (voor admin) === */
router.get("/reported", async (req, res) => {
  try {
    const reported = await Review.find({ reported: true }).sort({ date: -1 }).lean();
    res.json({ ok: true, total: reported.length, reported });
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij ophalen gemelde reviews" });
  }
});

/* === ⚠ Review melden === */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ ok: false, message: "Review niet gevonden" });

    review.reported = true;
    await review.save();

    res.json({ ok: true, message: "Review gemeld", review });
  } catch (err) {
    console.error("❌ Fout bij melden review:", err);
    res.status(500).json({ ok: false, message: "Serverfout bij melden review" });
  }
});

module.exports = router;
