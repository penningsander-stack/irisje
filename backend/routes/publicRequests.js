// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/* ======================================================
   A17 – Bedrijf-gecentreerde context (READ ONLY)
   ====================================================== */

router.get("/companyContext/:companySlug", async (req, res) => {
  try {
    const { companySlug } = req.params;

    // 🔧 FIX: geen findOne gebruiken
    const companies = await Company.find({
      slug: companySlug,
      active: true
    })
      .lean()
      .limit(1);

    const sourceCompany = companies[0];

    if (!sourceCompany) {
      return res.status(404).json({
        ok: false,
        message: "Bedrijf niet gevonden"
      });
    }

    const categories = Array.isArray(sourceCompany.categories)
      ? sourceCompany.categories
      : [];

    const specialties = Array.isArray(sourceCompany.specialties)
      ? sourceCompany.specialties
      : [];

    const city = sourceCompany.city;

    if (categories.length === 0 || !city) {
      return res.status(400).json({
        ok: false,
        message: "Bedrijf mist categorie of plaats"
      });
    }

    const candidateQuery = {
      _id: { $ne: sourceCompany._id },
      active: true,
      categories: { $in: categories }
    };

    if (specialties.length > 0) {
      candidateQuery.specialties = { $in: specialties };
    }

    const candidates = await Company.find(candidateQuery)
      .lean()
      .limit(50);

    const scored = candidates.map(c => {
      const overlap =
        specialties.length > 0 && Array.isArray(c.specialties)
          ? c.specialties.filter(s => specialties.includes(s)).length
          : 0;

      const cityMatch =
        String(c.city || "").trim().toLowerCase() ===
        String(city).trim().toLowerCase();

      return {
        company: c,
        cityMatch: cityMatch ? 1 : 0,
        overlap
      };
    });

    scored.sort((a, b) => {
      if (b.cityMatch !== a.cityMatch) return b.cityMatch - a.cityMatch;
      return b.overlap - a.overlap;
    });

    return res.json({
      ok: true,
      sourceCompany: {
        id: sourceCompany._id,
        slug: sourceCompany.slug,
        name: sourceCompany.name,
        categories: sourceCompany.categories,
        specialties: sourceCompany.specialties,
        city: sourceCompany.city
      },
      matches: scored.slice(0, 20).map(s => ({
        id: s.company._id,
        slug: s.company.slug,
        name: s.company.name,
        categories: s.company.categories,
        specialties: s.company.specialties,
        city: s.company.city
      })),
      meta: {
        strategy: "categories + specialty overlap, city-first",
        limit: 20
      }
    });
  } catch (err) {
    console.error("companyContext error:", err);
    return res.status(500).json({
      ok: false,
      message: "Serverfout"
    });
  }
});

/* ======================================================
   BESTAANDE ROUTES – ONGEWIJZIGD
   ====================================================== */

// (rest van het bestand blijft exact zoals nu)

module.exports = router;
