// backend/routes/companiesSimilar.js
const express = require("express");
const mongoose = require("mongoose");
const Company = require("../models/company");

const router = express.Router();

/**
 * GET /api/companies/similar
 *
 * Query:
 *  - anchorSlug (verplicht)
 *
 * Doel:
 *  - Neem bedrijf A (anker) op basis van slug
 *  - Leid criteria AF van bedrijf A:
 *      - category (1e categorie)
 *      - specialty (1e specialisme, alleen als aanwezig)
 *      - city / regions / worksNationwide
 *  - Geef max. 4 ANDERE bedrijven terug
 */
router.get("/similar", async (req, res) => {
  try {
    const { anchorSlug } = req.query;

    if (!anchorSlug) {
      return res.status(400).json({
        ok: false,
        message: "anchorSlug is verplicht",
      });
    }

    // 1) Haal ankerbedrijf op
    const anchor = await Company.findOne({
      slug: anchorSlug,
      active: true,
    }).lean();

    if (!anchor) {
      return res.status(404).json({
        ok: false,
        message: "Ankerbedrijf niet gevonden",
      });
    }

    // 2) Leid criteria af van ankerbedrijf
    const anchorCategory =
      Array.isArray(anchor.categories) && anchor.categories.length > 0
        ? anchor.categories[0]
        : null;

    const anchorSpecialty =
      Array.isArray(anchor.specialties) && anchor.specialties.length > 0
        ? anchor.specialties[0]
        : null;

    if (!anchorCategory) {
      return res.json({
        ok: true,
        anchor,
        companies: [],
      });
    }

    // 3) Basisquery: zelfde categorie, ander bedrijf
    const query = {
      _id: { $ne: new mongoose.Types.ObjectId(anchor._id) },
      active: true,
      categories: anchorCategory,
    };

    // 4) Specialisme alleen toepassen als aanwezig
    if (anchorSpecialty) {
      query.specialties = anchorSpecialty;
    }

    // 5) Locatie-logica (exact volgens bestaand model)
    if (anchor.worksNationwide === true) {
      // geen extra filter
    } else if (Array.isArray(anchor.regions) && anchor.regions.length > 0) {
      query.$or = [
        { regions: { $in: anchor.regions } },
        { worksNationwide: true },
      ];
    } else if (anchor.city) {
      query.$or = [
        { city: anchor.city },
        { worksNationwide: true },
      ];
    }

    // 6) Ophalen + limiteren
    const companies = await Company.find(query)
      .select(
        "_id name slug city regions worksNationwide avgRating reviewCount logo"
      )
      .sort({
        avgRating: -1,
        reviewCount: -1,
        name: 1,
      })
      .limit(4)
      .lean();

    return res.json({
      ok: true,
      anchor: {
        _id: anchor._id,
        name: anchor.name,
        slug: anchor.slug,
      },
      companies,
    });
  } catch (err) {
    console.error("companies/similar error:", err);
    return res.status(500).json({
      ok: false,
      message: "Interne serverfout",
    });
  }
});

module.exports = router;
