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
  - Ophalen aanvraag + bedrijven
  - LEIDEND: request.sector
  - Specialismen:
      * specialties leeg  -> meenemen
      * specialties gevuld -> alleen matchende meenemen
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

    if (!category || !specialty) {
      return res.status(400).json({
        ok: false,
        message: "Aanvraag mist categorie of specialisme"
      });
    }

    const companies = await Company.find({
      category: category,
      isActive: true,
      $or: [
        { specialties: { $exists: false } },
        { specialties: { $size: 0 } },
        { specialties: { $in: [specialty] } }
      ]
    })
      .select("-password")
      .lean();

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
