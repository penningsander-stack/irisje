// backend/routes/reviews.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const Review = require("../models/review");
const Company = require("../models/Company");

// ✅ Reviews van ingelogd bedrijf
router.get("/company", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.json({ ok: true, reviews: [] });

    const reviews = await Review.find({ company: company._id }).sort({ createdAt: -1 });
    return res.json({ ok: true, reviews });
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Review melden — LET OP: frontend roept /reviews/report/:id aan
router.post("/report/:id", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(403).json({ ok: false, error: "Geen bedrijf gekoppeld" });

    const review = await Review.findOne({ _id: req.params.id, company: company._id });
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });

    review.reported = true;
    await review.save();
    return res.json({ ok: true, message: "Review gemeld" });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij melden review" });
  }
});

// (optioneel: ook het pad /:id/report ondersteunen, voor oudere frontends)
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(403).json({ ok: false, error: "Geen bedrijf gekoppeld" });

    const review = await Review.findOne({ _id: req.params.id, company: company._id });
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });

    review.reported = true;
    await review.save();
    return res.json({ ok: true, message: "Review gemeld" });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij melden review" });
  }
});

module.exports = router;
