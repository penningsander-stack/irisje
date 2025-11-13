// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const Review = require("../models/review");
const { getLogs, addLog } = require("../utils/logger");

/**
 * 🌸 Irisje.nl – Admin routes
 * Bevat:
 * - Reviewbeheer (melden / afhandelen / verwijderen)
 * - Serverlogs voor statuspagina
 */

/* ============================================================
   📜 LOGS
============================================================ */
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();

    if (!Array.isArray(logs)) {
      return res.json([]);
    }

    const recent = logs.slice(-30).reverse();
    res.status(200).json(recent);
  } catch (err) {
    console.error("❌ Fout bij ophalen logs:", err);
    res.status(500).json([]);
  }
});

/* ============================================================
   💬 GEMELDE REVIEWS
============================================================ */

/**
 * ✅ GET /api/admin/reported
 * Haal alle gemelde reviews op (reported = true, niet verwijderd)
 */
router.get("/reported", async (req, res) => {
  try {
    const reportedReviews = await Review.find({
      reported: true,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    addLog(`💬 Opgevraagd: ${reportedReviews.length} gemelde reviews.`, "debug");
    res.json(reportedReviews);
  } catch (err) {
    console.error("❌ Fout bij ophalen gemelde reviews:", err);
    addLog(`❌ Fout bij ophalen gemelde reviews: ${err.message}`, "error");
    res.status(500).json({ message: "Serverfout bij ophalen gemelde reviews" });
  }
});

/**
 * ✅ PATCH /api/admin/resolve/:id
 * Markeer een gemelde review als afgehandeld (reported = false)
 */
router.patch("/resolve/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      addLog(`❌ Poging tot afhandelen onbekende review: ${id}`, "error");
      return res.status(404).json({ message: "Review niet gevonden" });
    }

    review.reported = false;
    await review.save();

    const logMsg = `✅ Review ${id} gemarkeerd als afgehandeld.`;
    console.log(logMsg);
    addLog(logMsg, "info");

    res.json({ message: "Review afgehandeld", review });
  } catch (err) {
    console.error("❌ Fout bij afhandelen review:", err);
    addLog(`❌ Fout bij afhandelen review ${req.params.id}: ${err.message}`, "error");
    res.status(500).json({ message: "Serverfout bij afhandelen review" });
  }
});

/**
 * 🗑️ PATCH /api/admin/delete/:id
 * Markeer een review als verwijderd (soft delete)
 */
router.patch("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      addLog(`❌ Poging tot verwijderen onbekende review: ${id}`, "error");
      return res.status(404).json({ message: "Review niet gevonden" });
    }

    review.isDeleted = true;
    await review.save();

    const logMsg = `🗑️ Review ${id} gemarkeerd als verwijderd.`;
    console.log(logMsg);
    addLog(logMsg, "warn");

    res.json({ message: "Review gemarkeerd als verwijderd", review });
  } catch (err) {
    console.error("❌ Fout bij verwijderen review:", err);
    addLog(`❌ Fout bij verwijderen review ${req.params.id}: ${err.message}`, "error");
    res.status(500).json({ message: "Serverfout bij verwijderen review" });
  }
});

module.exports = router;
