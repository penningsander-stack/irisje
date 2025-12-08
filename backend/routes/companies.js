// backend/routes/companies.js – FIXED & OPTIMIZED (v20251208)

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

// GET /api/companies/search
router.get("/search", async (req, res) => {
  try {
    const { q = "", category = "", city = "" } = req.query;

    const filters = {};

    // Zoekwoord (q) in meerdere bestaande velden
    if (q) {
      const regex = new RegExp(q, "i");
      filters.$or = [
        { name: regex },
        { description: regex },
        { specialties: regex },
        { specializations: regex },
        { categories: regex }
      ];
    }

    // Filter: categorie
    if (category) {
      filters.categories = { $regex: new RegExp(category, "i") };
    }

    // Filter: stad
    if (city) {
      filters.city = { $regex: new RegExp(city, "i") };
    }

    const companies = await Company.find(filters).lean();

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

// GET /api/companies/slug/:slug
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
