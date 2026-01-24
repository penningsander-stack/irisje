// backend/routes/publicRequests.js
// v2026-01-24 – STRICT MATCH: sector + city + specialty (optie B)

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/*
 * GET /api/publicRequests/:id
 * Geeft:
 * - de aanvraag
 * - alleen bedrijven die EXACT matchen op:
 *   - sector (category)
 *   - city
 *   - specialty (MOET bestaan en matchen)
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Aanvraag niet gevonden",
      });
    }

    const { sector, specialty, city } = request;

    // 🔒 STRIKTE MATCH (optie B)
    const companies = await Company.find({
      isVerified: true,
      city: city,
      categories: sector,
      specialties: {
        $exists: true,
        $ne: [],
        $in: [specialty],
      },
    })
      .lean()
      .exec();

    res.json({
      ok: true,
      request: {
        _id: request._id,
        sector,
        specialty,
        city,
      },
      companies,
      noLocalResults: companies.length === 0,
    });
  } catch (err) {
    console.error("❌ publicRequests error:", err);
    res.status(500).json({
      ok: false,
      message: "Serverfout bij ophalen aanvraag",
    });
  }
});

module.exports = router;
