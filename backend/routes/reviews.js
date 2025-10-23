// backend/routes/reviews.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const Review = require("../models/review");
const Company = require("../models/Company");

// ✅ Reviews van ingelogd bedrijf (voor dashboard)
router.get("/company", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.json({ ok: true, reviews: [] });

    const reviews = await Review.find({ company: company._id }).sort({ createdAt: -1 });
    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Review melden (dashboard)
router.post("/report/:id", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(403).json({ ok: false, error: "Geen bedrijf gekoppeld" });

    const review = await Review.findOne({ _id: req.params.id, company: company._id });
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });

    review.reported = true;
    await review.save();
    res.json({ ok: true, message: "Review gemeld" });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij melden review" });
  }
});

// 🔓 Publiek: reviews opvragen per bedrijf (slug)
router.get("/public/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    const reviews = await Review.find({ company: company._id }).sort({ createdAt: -1 });
    res.json({ ok: true, items: reviews });
  } catch (err) {
    console.error("reviews/public get error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen public reviews" });
  }
});

// 🔓 Publiek: review plaatsen
router.post("/public/:slug", async (req, res) => {
  try {
    const { name, rating, message } = req.body || {};
    if (!name || !rating || !message) {
      return res.status(400).json({ ok: false, error: "Ontbrekende velden" });
    }
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });

    const r = await Review.create({
      company: company._id,
      name,
      rating: Number(rating),
      message
    });

    // eenvoudige aggregatie updaten
    const agg = await Review.aggregate([
      { $match: { company: company._id } },
      { $group: { _id: "$company", avg: { $avg: "$rating" }, cnt: { $sum: 1 } } }
    ]);
    if (agg[0]) {
      company.avgRating = Math.round(agg[0].avg * 10) / 10;
      company.reviewCount = agg[0].cnt;
      await company.save();
    }

    res.json({ ok: true, message: "Review geplaatst", id: r._id });
  } catch (err) {
    console.error("reviews/public post error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij plaatsen review" });
  }
});

module.exports = router;
