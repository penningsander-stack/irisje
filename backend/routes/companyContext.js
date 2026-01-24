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
        message: "companySlug ontbreekt",
      });
    }

    // Gebruik direct de Mongo-collection (om model/import problemen te omzeilen)
    const companies = mongoose.connection.collection("companies");

    // Public: alleen actieve bedrijven tonen
    // Let op: als "active" bij oudere records niet bestaat, dan willen we die niet blokkeren.
    const activePublicMatch = { $or: [{ active: true }, { active: { $exists: false } }] };

    // 1) Bronbedrijf
    const sourceArr = await companies
      .aggregate([
        {
          $match: {
            slug: String(companySlug).trim().toLowerCase(),
            ...activePublicMatch,
          },
        },
        { $limit: 1 },
      ])
      .toArray();

    const source = sourceArr[0];

    if (!source) {
      return res.status(404).json({
        ok: false,
        message: "Bedrijf niet gevonden",
      });
    }

    const categories = Array.isArray(source.categories) ? source.categories : [];
    const specialties = Array.isArray(source.specialties) ? source.specialties : [];
    const cityNorm = String(source.city || "").trim().toLowerCase();

    // Als er geen categorieën zijn, kunnen we niet “vergelijkbare” bedrijven bepalen.
    if (categories.length === 0) {
      return res.json({
        ok: true,
        sourceCompany: source,
        matches: [],
      });
    }

    // 2) Vergelijkbare bedrijven
    const matchAnd = [
      activePublicMatch,
      { slug: { $ne: source.slug } },
      { categories: { $in: categories } },
    ];

    // Specialties alleen filteren als er iets is om op te filteren
    if (specialties.length > 0) {
      matchAnd.push({ specialties: { $in: specialties } });
    }

    const candidates = await companies
      .aggregate([
        { $match: { $and: matchAnd } },
        { $limit: 80 }, // iets ruimer, daarna sorteren we en pakken top 20
      ])
      .toArray();

    // 3) Sortering
    const scored = candidates.map((c) => {
      const cCity = String(c.city || "").trim().toLowerCase();
      const cityMatch = cCity && cityNorm ? (cCity === cityNorm ? 1 : 0) : 0;

      const overlap =
        specialties.length > 0 && Array.isArray(c.specialties)
          ? c.specialties.filter((s) => specialties.includes(s)).length
          : 0;

      return { c, cityMatch, overlap };
    });

    scored.sort((a, b) => {
      if (b.cityMatch !== a.cityMatch) return b.cityMatch - a.cityMatch;
      if (b.overlap !== a.overlap) return b.overlap - a.overlap;

      // stabiele fallback
      return String(a.c.name || "").localeCompare(String(b.c.name || ""), "nl", {
        sensitivity: "base",
      });
    });

    return res.json({
      ok: true,
      sourceCompany: source,
      matches: scored.slice(0, 20).map((x) => x.c),
    });
  } catch (err) {
    console.error("companyContext error:", err);
    return res.status(500).json({
      ok: false,
      message: "Serverfout",
    });
  }
});

module.exports = router;
