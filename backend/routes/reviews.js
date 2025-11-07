// backend/routes/reviews.js
const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Company = require("../models/Company");

// ✅ Alle reviews van een bedrijf ophalen via slug of ID
router.get("/company/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier?.trim();
    if (!identifier) {
      return res.status(400).json({ error: "Geen bedrijfsidentifier opgegeven" });
    }

    let company = null;

    // 🔹 Controleer of identifier een MongoDB ObjectId is of een slug
    if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
      company = await Company.findById(identifier).lean();
    } else {
      company = await Company.findOne({ slug: identifier }).lean();
    }

    if (!company) {
      return res.status(404).json({ error: "Bedrijf niet gevonden" });
    }

    // 🔹 Reviews ophalen
    const reviews = await Review.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();

    // 🔹 Altijd geldig JSON-antwoord teruggeven
    res.json({
      ok: true,
      company: {
        name: company.name,
        slug: company.slug,
        avgRating: company.avgRating || 0,
        reviewCount: reviews.length,
      },
      reviews,
    });
  } catch (error) {
    console.error("❌ Fout bij ophalen reviews:", error);
    res.status(500).json({ error: "Serverfout bij ophalen reviews" });
  }
});

// ✅ Review melden (🚩)
router.patch("/report/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Geen review-ID opgegeven" });

    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review niet gevonden" });

    // Markeer als gemeld (veilig, idempotent)
    review.isReported = true;
    await review.save();

    res.json({ success: true, message: "Review succesvol gemeld" });
  } catch (error) {
    console.error("❌ Fout bij melden review:", error);
    res.status(500).json({ error: "Serverfout bij melden review" });
  }
});

module.exports = router;
