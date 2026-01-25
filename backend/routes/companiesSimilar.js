// backend/routes/companiesSimilar.js

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

/**
 * GET /api/companies/similar
 * Query:
 *  - anchorSlug (verplicht)
 *
 * Logica:
 *  1. Zoek ankerbedrijf op slug (GEEN active-filter)
 *  2. Zoek max 4 andere bedrijven met:
 *     - zelfde city
 *     - overlap in categories
 *     - ander _id dan anker
 */

router.get("/similar", async (req, res) => {
  try {
    const { anchorSlug } = req.query;

    if (!anchorSlug) {
      return res.status(400).json({
        ok: false,
        message: "anchorSlug ontbreekt"
      });
    }

    // 1️⃣ Ankerbedrijf ophalen (GEEN active-filter)
    const anchor = await Company.findOne({ slug: anchorSlug });

    if (!anchor) {
      return res.status(404).json({
        ok: false,
        message: "Ankerbedrijf niet gevonden"
      });
    }

    // 2️⃣ Vergelijkbare bedrijven zoeken
    const similarCompanies = await Company.find({
      _id: { $ne: anchor._id },
      city: anchor.city,
      categories: { $in: anchor.categories }
    })
      .limit(4)
      .select(
        "name slug city categories specialties avgRating reviewCount isVerified"
      );

    return res.json({
      ok: true,
      anchorCompany: {
        _id: anchor._id,
        name: anchor.name,
        slug: anchor.slug,
        city: anchor.city,
        categories: anchor.categories
      },
      companies: similarCompanies
    });

  } catch (err) {
    console.error("companiesSimilar error:", err);
    return res.status(500).json({
      ok: false,
      message: "Interne serverfout"
    });
  }
});

module.exports = router;
