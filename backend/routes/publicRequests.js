// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/*
  POST /api/publicRequests
  - Fase 1: public request aanmaken
  - Vereist: sector, specialty, city
*/
router.post("/", async (req, res) => {
  try {
    const { sector, category, specialty, city } = req.body || {};
    const finalSector = sector || category;

    if (!finalSector || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector, specialisme en plaats zijn verplicht."
      });
    }

    const created = await Request.create({
      sector: finalSector,
      category: finalSector, // compatibiliteit
      specialty,
      city
    });

    return res.status(201).json({
      ok: true,
      request: {
        _id: created._id,
        sector: created.sector,
        specialty: created.specialty,
        city: created.city
      }
    });
  } catch (error) {
    console.error("publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij aanmaken aanvraag"
    });
  }
});

/*
  GET /api/publicRequests/:id
  - Alle matchende bedrijven tonen
  - Sortering (zonder reviews):
      1) zelfde stad
      2) heeft specialismen ingevuld
      3) alfabetisch op naam
*/
router.get("/:id", async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await Request.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Aanvraag niet gevonden"
      });
    }

    const category = request.sector || request.category;
    const specialty = request.specialty;
    const city = request.city;

    if (!category || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "Aanvraag mist categorie, specialisme of plaats"
      });
    }

    const baseFilter = {
      categories: { $in: [category] },
      $or: [
        { specialties: { $exists: false } },
        { specialties: { $size: 0 } },
        { specialties: { $in: [specialty] } }
      ]
    };

    let companies = await Company.find(baseFilter)
      .select("-password")
      .lean();

    // 🔽 Sortering (deterministisch, zonder reviews)
    companies.sort((a, b) => {
      // 1) zelfde stad eerst
      const aLocal = a.city === city;
      const bLocal = b.city === city;
      if (aLocal !== bLocal) return aLocal ? -1 : 1;

      // 2) bedrijven met ingevulde specialismen eerst
      const aHasSpecs = Array.isArray(a.specialties) && a.specialties.length > 0;
      const bHasSpecs = Array.isArray(b.specialties) && b.specialties.length > 0;
      if (aHasSpecs !== bHasSpecs) return aHasSpecs ? -1 : 1;

      // 3) alfabetisch (stabiel)
      return (a.name || "").localeCompare(b.name || "", "nl", { sensitivity: "base" });
    });

    return res.json({
      ok: true,
      request: {
        _id: request._id,
        sector: category,
        specialty: request.specialty,
        city: request.city
      },
      companies
    });
  } catch (error) {
    console.error("publicRequests GET error:", error);
    return res.status(500).json({
      ok: false,
      message: "Interne serverfout"
    });
  }
});

module.exports = router;
