// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const { getLogs } = require("../utils/logger");

/**
 * 🌸 Irisje.nl – Admin routes
 * Bevat:
 * - Reviewbeheer (melden / afhandelen)
 * - Serverlogs voor statuspagina
 */

/* === 📜 LOGS === */
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    res.json({ ok: true, logs });
  } catch (err) {
    console.error("❌ Fout bij ophalen logs:", err);
    res.status(500).json({ ok: false, message: "Kon logs niet ophalen" });
  }
});

/* === 💬 GEMELDE REVIEWS === */

/**
 * ✅ PATCH /api/admin/resolve/:id
 * Markeer een gemelde review als afgehandeld (reported = false)
 */
router.patch("/resolve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review niet gevonden" });
    }

    review.reported = false;
    await review.save();

    console.log(`✅ Review ${id} gemarkeerd als afgehandeld.`);
    res.json({ message: "Review afgehandeld", review });
  } catch (err) {
    console.error("❌ Fout bij afhandelen review:", err);
    res.status(500).json({ message: "Serverfout bij afhandelen review" });
  }
});

/**
 * ✅ GET /api/admin/reported
 * Haal alle gemelde reviews op (reported = true)
 */
router.get("/reported", async (req, res) => {
  try {
    const reportedReviews = await Review.find({ reported: true }).sort({ createdAt: -1 }).lean();
    res.json(reportedReviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    res.status(500).json({ message: "Serverfout bij ophalen gemelde reviews" });
  }
});

module.exports = router;
