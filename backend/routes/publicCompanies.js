// backend/routes/publicCompanies.js
import express from "express";
import Company from "../models/company.js";

const router = express.Router();

/**
 * GET /api/publicCompanies
 *
 * Query (allemaal optioneel):
 * - category
 * - specialty
 * - region
 * - minRating
 * - verified
 * - sort
 *
 * Gedrag:
 * - Geen filters → fallback = populaire bedrijven
 * - Nooit HTTP 400
 */
router.get("/", async (req, res) => {
  try {
    const {
      category,
      specialty,
      region,
      minRating,
      verified,
      sort,
    } = req.query;

    const filter = {};

    if (category) {
      filter.categories = { $in: [category] };
    }

    if (specialty) {
      filter.specialties = { $in: [specialty] };
    }

    if (region) {
      filter.regions = { $in: [region] };
    }

    if (verified === "yes") {
      filter.isVerified = true;
    }

    if (minRating) {
      filter.avgRating = { $gte: Number(minRating) };
    }

    let query = Company.find(filter);

    // Sortering
    switch (sort) {
      case "rating":
        query = query.sort({ avgRating: -1 });
        break;
      case "reviews":
        query = query.sort({ reviewCount: -1 });
        break;
      case "verified":
        query = query.sort({ isVerified: -1 });
        break;
      case "az":
        query = query.sort({ name: 1 });
        break;
      default:
        // relevance / default
        query = query.sort({ isVerified: -1, avgRating: -1 });
    }

    let companies = await query.limit(50).lean();

    // 🔁 FALLBACK: geen filters of geen resultaat
    let fallbackUsed = false;

    if (companies.length === 0) {
      fallbackUsed = true;

      companies = await Company.find({})
        .sort({ isVerified: -1, avgRating: -1, reviewCount: -1 })
        .limit(50)
        .lean();
    }

    return res.json({
      ok: true,
      fallbackUsed,
      companies,
    });
  } catch (err) {
    console.error("❌ publicCompanies error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

export default router;
