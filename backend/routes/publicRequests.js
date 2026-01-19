// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/Request");
const Company = require("../models/Company");

/*
  GET /api/publicRequests/:id

  Doel:
  - Ophalen van een aanvraag
  - Selecteren van passende bedrijven op basis van:
    1. categorie (AND)
    2. specialisme (AND, meervoud ondersteund)

  Matching-regels:
  - company.category === request.category
  - request.specialty moet voorkomen in company.specialties[]
*/

router.get("/:id", async (req, res) => {
  try {
    const requestId = req.params.id;

    // 1. Aanvraag ophalen
    const request = await Request.findById(requestId).lean();

    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Aanvraag niet gevonden"
      });
    }

    const { category, specialty } = request;

    if (!category || !specialty) {
      return res.status(400).json({
        ok: false,
        message: "Aanvraag mist categorie of specialisme"
      });
    }

    // 2. Bedrijven zoeken met AND-logica
    const companies = await Company.find({
      category: category,
      specialties: { $in: [specialty] },
      isActive: true
    })
      .select("-password")
      .lean();

    // 3. Resultaat teruggeven
    return res.json({
      ok: true,
      request: {
        _id: request._id,
        category: request.category,
        specialty: request.specialty,
        city: request.city
      },
      companies
    });
  } catch (error) {
    console.error("publicRequests error:", error);
    return res.status(500).json({
      ok: false,
      message: "Interne serverfout"
    });
  }
});

module.exports = router;
