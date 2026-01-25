// backend/routes/companies.js

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

/**
 * GET /api/companies
 * Optionele filters:
 *  - category (string) → matcht tegen Company.categories (array)
 *  - city (string) → case-insensitive exacte match
 *
 * Response:
 *  { ok: true, companies: [...] }
 */
router.get("/", async (req, res) => {
  try {
    const { category, city } = req.query;

    const query = {};

    // Filter op categorie (array-match)
    if (category) {
      query.categories = { $in: [category] };
    }

    // Filter op plaats (case-insensitive exacte match)
    if (city) {
      query.city = new RegExp(`^${city}$`, "i");
    }

    const companies = await Company.find(query)
      .select("name city categories specialties slug avgRating reviewCount isVerified")
      .sort({ name: 1 });

    return res.json({
      ok: true,
      companies,
    });
  } catch (err) {
    console.error("GET /api/companies error:", err);
    return res.status(500).json({
      ok: false,
      message: "Bedrijven konden niet worden opgehaald",
    });
  }
});

/**
 * GET /api/companies/slug/:slug
 * Haalt één bedrijf op via slug
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug });
    if (!company) {
      return res.status(404).json({ ok: false, message: "Bedrijf niet gevonden" });
    }
    return res.json({ ok: true, company });
  } catch (err) {
    console.error("GET /api/companies/slug error:", err);
    return res.status(500).json({ ok: false, message: "Fout bij ophalen bedrijf" });
  }
});

/**
 * GET /api/companies/me
 * PATCH /api/companies/me
 * (ongewijzigd; auth-afhankelijk)
 */
// bestaande me-routes blijven hier ongewijzigd

module.exports = router;
