// backend/routes/companyContext.js

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

/*
  A17 – Bedrijf-gecentreerde context
  GET /api/companyContext/:companySlug
*/

router.get("/:companySlug", async (req, res) => {
  try {
    const { companySlug } = req.params;

    if (!companySlug) {
      return res.status(400).json({
        ok: false,
        message: "companySlug ontbreekt"
      });
    }

    const companies = mongoose.connection.collection("companies");

    // 1) Bronbedrijf
    const sourceArr = await companies
      .aggregate([
        { $match: { slug: companySlug, active: true } },
        { $limit: 1 }
      ])
      .toArray();

    const source = sourceArr[0];

    if (!source) {
      return res.status(404).json({
        ok: false,
        message: "Bedrijf niet gevonden"
      });
    }

    const categories = Array.isArray(source.categories) ? source.categories : [];
    const specialties = Array.isArray(source.specialties) ? source.specialties : [];
    const cityNorm = String(source.city || "").trim().toLowerCase();

    // 2) Vergelijkbare bedrijven
    const matchAnd = [
      { active: true },
      { slug: { $ne: source.slug } },
      { categories: { $in: categories } }
    ];

    if (specialties.length > 0) {
      matchAnd.push({ specialties: { $in: specialties } });
    }

    const candidates = await companies
      .aggregate([
        { $match: { $and: matchAnd } },
        { $limit: 50 }
      ])
      .toArray();

    // 3) Sortering
    const scored = candidates.map(c => {
      const cityMatch =
        String(c.city || "").trim().toLowerCase() === cityNorm ? 1 : 0;

      const overlap =
        specialties.length > 0 && Array.isArray(c.specialties)
          ? c.specialties.filter(s => specialties.includes(s)).length
          : 0;

      return { c, cityMatch, overlap };
    });

    scored.sort((a, b) => {
      if (b.cityMatch !== a.cityMatch) return b.cityMatch - a.cityMatch;
      return b.overlap - a.overlap;
    });

    return res.json({
      ok: true,
      sourceCompany: source,
      matches: scored.slice(0, 20).map(x => x.c)
    });
  } catch (err) {
    console.error("companyContext error:", err);
    return res.status(500).json({
      ok: false,
      message: "Serverfout"
    });
  }
});

module.exports = router;
