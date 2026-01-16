// backend/routes/publicRequests.js
// v20260117-PUBLICREQUESTS-MATCH-CASEINSENSITIVE-DEBUG
// - Case-insensitive matching (regex exact match)
// - Optionele debug-tellingen via body: { debug: true }
// GEEN nieuwe routes, GEEN nieuw model

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Company = require("../models/company");

function escRegex(s) {
  return String(s || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/", async (req, res) => {
  try {
    const { sector, city, specialty, debug } = req.body || {};

    if (!sector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector en plaats zijn verplicht."
      });
    }

    const requestId = new mongoose.Types.ObjectId().toString();

    const sectorNorm = String(sector).trim();
    const cityNorm = String(city).trim();
    const specialtyNorm = String(specialty || "").trim();

    // Case-insensitive EXACT match op strings in arrays
    const sectorRe = new RegExp(`^${escRegex(sectorNorm)}$`, "i");
    const cityRe = new RegExp(`^${escRegex(cityNorm)}$`, "i");
    const specialtyRe = specialtyNorm ? new RegExp(`^${escRegex(specialtyNorm)}$`, "i") : null;

    // Basisquery (zelfde logica als eerder, maar case-insensitive)
    const query = {
      active: true,
      isVerified: true,
      categories: sectorRe,
      $or: [
        { city: cityRe },
        { regions: cityRe },
        { worksNationwide: true }
      ]
    };

    if (specialtyRe) {
      query.specialties = specialtyRe;
    }

    const companies = await Company.find(query)
      .select("_id name slug city avgRating reviewCount")
      .limit(10)
      .lean();

    // Optionele debug: toont waar het wegvalt (zonder extra routes)
    if (debug === true) {
      const baseActive = { active: true };
      const baseActiveVerified = { active: true, isVerified: true };
      const baseCat = { ...baseActiveVerified, categories: sectorRe };
      const baseCatAnyVerify = { ...baseActive, categories: sectorRe };

      const withCity = {
        ...baseCat,
        $or: [{ city: cityRe }, { regions: cityRe }, { worksNationwide: true }]
      };

      const withCityAnyVerify = {
        ...baseCatAnyVerify,
        $or: [{ city: cityRe }, { regions: cityRe }, { worksNationwide: true }]
      };

      const withCityAndSpec = specialtyRe
        ? { ...withCity, specialties: specialtyRe }
        : null;

      const withCityAndSpecAnyVerify = specialtyRe
        ? { ...withCityAnyVerify, specialties: specialtyRe }
        : null;

      const debugInfo = {
        input: { sector: sectorNorm, city: cityNorm, specialty: specialtyNorm || "" },
        counts: {
          active_total: await Company.countDocuments(baseActive),
          active_verified_total: await Company.countDocuments(baseActiveVerified),

          category_match_verified: await Company.countDocuments(baseCat),
          category_match_anyVerification: await Company.countDocuments(baseCatAnyVerify),

          category_city_match_verified: await Company.countDocuments(withCity),
          category_city_match_anyVerification: await Company.countDocuments(withCityAnyVerify),

          ...(specialtyRe
            ? {
                category_city_specialty_match_verified: await Company.countDocuments(withCityAndSpec),
                category_city_specialty_match_anyVerification: await Company.countDocuments(withCityAndSpecAnyVerify)
              }
            : {})
        }
      };

      return res.status(201).json({
        ok: true,
        requestId,
        companies: Array.isArray(companies) ? companies : [],
        debug: debugInfo
      });
    }

    return res.status(201).json({
      ok: true,
      requestId,
      companies: Array.isArray(companies) ? companies : []
    });
  } catch (error) {
    console.warn("❌ publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij starten aanvraag"
    });
  }
});

module.exports = router;
