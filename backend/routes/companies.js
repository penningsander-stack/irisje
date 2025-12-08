// backend/routes/companies.js – ULTIMATE SEARCH VERSION (Option B – v20251212)

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

/**
 * SAFE MATCH helper
 * - Works for: string, array, null, undefined
 * - Prevents server crashes when categories contain mixed types
 */
function buildFlexibleRegexMatch(field, regex) {
  return {
    $or: [
      { [field]: regex },                   // match string fields
      { [field]: { $elemMatch: regex } },   // match arrays
    ]
  };
}

/**
 * SEARCH ROUTE
 * Supports:
 * - q (zoekwoord)
 * - category
 * - city
 * - safe fallback for all fields
 */
router.get("/search", async (req, res) => {
  try {
    const { q = "", category = "", city = "" } = req.query;

    const filters = [];

    // ---------------------------------------------
    // 🔍 Zoekwoord (q)
    // ---------------------------------------------
    if (q) {
      const regex = new RegExp(q, "i");

      filters.push({
        $or: [
          { name: regex },
          { description: regex },
          { specialties: regex },
          { specializations: regex },
          { categories: regex },
          { regions: regex }
        ]
      });
    }

    // ---------------------------------------------
    // 🏷 Categorie (veilig voor arrays + strings)
    // ---------------------------------------------
    if (category) {
      const regex = new RegExp(category, "i");
      filters.push(buildFlexibleRegexMatch("categories", regex));
    }

    // ---------------------------------------------
    // 🏙 Stad (city)
    // ---------------------------------------------
    if (city) {
      const regex = new RegExp(city, "i");
      filters.push({
        $or: [
          { city: regex },
          { regions: regex }
        ]
      });
    }

    // Combine all filters safely
    const finalQuery = filters.length > 0 ? { $and: filters } : {};

    const companies = await Company.find(finalQuery).lean();

    res.json({
      ok: true,
      count: companies.length,
      companies
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

// ------------------------------------------------------------
// GET /api/companies/slug/:slug
// ------------------------------------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug }).lean();
    if (!company) return res.status(404).json({ ok: false, error: "Niet gevonden" });

    res.json({ ok: true, company });
  } catch (err) {
    console.error("COMPANY LOOKUP ERROR:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

module.exports = router;
