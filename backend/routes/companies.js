// backend/routes/companies.js – FULLY FIXED VERSION (safe regex + no elemMatch crash)

const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

// Helper: safely build regex
function buildRegexSafe(value) {
  if (!value) return null;
  try {
    return new RegExp(value, "i");
  } catch {
    return null;
  }
}

// Helper: search matcher for fields (string or array)
function matchField(field, regex) {
  return {
    $or: [
      { [field]: regex },
      { [field]: { $in: [regex] } }
    ]
  };
}

// GET /api/companies/search
router.get("/search", async (req, res) => {
  try {
    const { q, category, city } = req.query;

    const filters = [];

    // q search
    if (q) {
      const r = buildRegexSafe(q);
      if (r) {
        filters.push({
          $or: [
            { name: r },
            { tagline: r },
            { description: r }
          ]
        });
      }
    }

    // category filter
    if (category) {
      const r = buildRegexSafe(category);
      if (r) {
        filters.push(matchField("categories", r));
      }
    }

    // city filter
    if (city) {
      const r = buildRegexSafe(city);
      if (r) {
        filters.push({ city: r });
      }
    }

    const query = filters.length ? { $and: filters } : {};

    const companies = await Company.find(query)
      .sort({ reviewCount: -1, avgRating: -1 })
      .limit(40);

    return res.json({
      ok: true,
      count: companies.length,
      companies,
    });

  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ ok: false, error: "serverfout" });
  }
});

module.exports = router;
