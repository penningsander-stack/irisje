// backend/routes/reviews.js
// v20251230-REVIEWS-STATUS-CLEAN

const express = require("express");
const router = express.Router();

const Review = require("../models/review");
const Company = require("../models/company");

/* ============================================================
   📥 Reviews ophalen (ALLEEN approved)
   GET /api/reviews/company/:identifier
============================================================ */
router.get("/company/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier?.trim();
    if (!identifier) {
      return res.status(400).json({ error: "Geen bedrijfsidentifier opgegeven" });
    }

    const company = /^[0-9a-fA-F]{24}$/.test(identifier)
      ? await Company.findById(identifier).lean()
      : await Company.findOne({ slug: identifier }).lean();

    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    const reviews = await Review.find({
      companyId: company._id,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      company: {
        name: company.name,
        slug: company.slug,
        avgRating: company.avgRating || 0,
        reviewCount: reviews.length,
      },
      items: reviews,
    });
  } catch (error) {
    console.error("❌ Fout bij ophalen reviews:", error);
    res.status(500).json({ error: "Serverfout bij ophalen reviews." });
  }
});

/* ============================================================
   📝 Nieuwe review indienen
   POST /api/reviews
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { companySlug, rating, comment } = req.body || {};

    if (!companySlug || !rating || !comment) {
      return res.status(400).json({
        ok: false,
        error: "companySlug, rating en comment zijn verplicht",
      });
    }

    const company = await Company.findOne({ slug: companySlug });
    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Bedrijf niet gevonden",
      });
    }

    const review = new Review({
      companyId: company._id,
      rating,
      comment,
      status: "pending",
    });

    await review.save();

    res.json({
      ok: true,
      message: "Review ontvangen en wacht op goedkeuring.",
    });
  } catch (error) {
    console.error("❌ Fout bij opslaan review:", error);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij opslaan review.",
    });
  }
});

/* ============================================================
   🚩 Review melden
   PATCH /api/reviews/report/:id
============================================================ */
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Geen review-ID opgegeven" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ error: "Review niet gevonden" });
    }

    review.reported = true;
    await review.save();

    res.json({ ok: true, message: "Review succesvol gemeld" });
  } catch (error) {
    console.error("❌ Fout bij melden review:", error);
    res.status(500).json({ error: "Serverfout bij melden review." });
  }
});

module.exports = router;
