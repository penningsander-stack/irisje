// backend/routes/companies.js

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

// helpers
function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// alias mapping
const CATEGORY_ALIASES = {
  advocaat: ["juridisch"],
  jurist: ["juridisch"],
};

// LIJSTEN
router.get("/lists", async (req, res) => {
  try {
    const categories = await Company.distinct("categories");
    res.json({ ok: true, categories: categories.sort() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ZOEKEN (publiek)
router.get("/search", async (req, res) => {
  try {
    const { category, specialty } = req.query;

    if (!category && !specialty) {
      return res.json({ ok: true, results: [], fallbackUsed: false, message: null });
    }

    const query = { active: true };

    if (category) {
      const key = String(category).toLowerCase();
      const values = CATEGORY_ALIASES[key] || [category];
      query.categories = {
        $elemMatch: {
          $regex: values.map(v => escapeRegex(v)).join("|"),
          $options: "i",
        },
      };
    }

    if (specialty) {
      query.specialties = {
        $elemMatch: { $regex: escapeRegex(specialty), $options: "i" },
      };
    }

    const results = await Company.find(query)
      // 🔧 SLUG TOEGEVOEGD
      .select("_id name slug city avgRating reviewCount isVerified categories specialties")
      .limit(20)
      .lean();

    res.json({ ok: true, results, fallbackUsed: false, message: null });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PUBLIEK VIA SLUG
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) return res.status(404).json({ ok: false, error: "Niet gevonden" });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
