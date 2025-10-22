const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const { verifyToken } = require("../middleware/auth");

router.get("/company", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
    const reviews = await Review.find({ company: companyId }).sort({ createdAt: -1 });
    res.json({ ok: true, reviews });
  } catch (err) {
    console.error("Fout bij ophalen reviews:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen reviews" });
  }
});

router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, company: req.user.id });
    if (!review) return res.status(404).json({ ok: false, error: "Review niet gevonden" });
    review.reported = true;
    await review.save();
    res.json({ ok: true, message: "Review gemeld" });
  } catch (err) {
    console.error("Fout bij melden review:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij melden review" });
  }
});

module.exports = router;
