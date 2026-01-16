// backend/routes/publicRequests.js
// v20260116-PUBLICREQUESTS-WITH-COMPANY-MATCHING
// Uitbreiding: match bedrijven en stuur ze direct terug in de POST-response
// GEEN nieuwe routes, GEEN nieuw model

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Company = require("../models/company");

// ============================================================
//  📨 Zoek-aanvraag starten + bedrijven matchen (zonder Request-opslag)
// ============================================================
router.post("/", async (req, res) => {
  try {
    const { sector, city, specialty } = req.body || {};

    if (!sector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector en plaats zijn verplicht."
      });
    }

    // ✔️ Tijdelijk maar geldig requestId (frontend verwacht dit)
    const requestId = new mongoose.Types.ObjectId().toString();

    // ----------------------------------------------------------
    // Company matching
    // ----------------------------------------------------------
    // Criteria:
    // - actief en geverifieerd
    // - categorie matcht sector
    // - (optioneel) specialisme matcht
    // - regio/stad matcht of werkt landelijk
    // ----------------------------------------------------------

    const sectorNorm = String(sector).trim();
    const cityNorm = String(city).trim();
    const specialtyNorm = String(specialty || "").trim();

    // Basisquery
    const query = {
      active: true,
      isVerified: true,
      categories: sectorNorm
    };

    // Specialisme (alleen toevoegen als ingevuld)
    if (specialtyNorm) {
      query.specialties = specialtyNorm;
    }

    // Stad / regio / landelijk
    query.$or = [
      { city: cityNorm },
      { regions: cityNorm },
      { worksNationwide: true }
    ];

    // Query uitvoeren
    const companies = await Company.find(query)
      .select("_id name slug city avgRating reviewCount")
      .limit(10)
      .lean();

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
