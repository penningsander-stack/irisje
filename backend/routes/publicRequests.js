// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/*
  POST /api/publicRequests
  - Public aanvraag aanmaken
  - Vereist: sector (of category), specialty, city
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
  - Alle matchende bedrijven
  - Reviews via aggregation ($lookup)
  - Ranking uitgebreid (O2A)
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

    const pipeline = [
      // Basis match: categorie + specialty (bedrijven zonder specialties niet uitsluiten)
      {
        $match: {
          categories: { $in: [category] },
          $or: [
            { specialties: { $exists: false } },
            { specialties: { $size: 0 } },
            { specialties: { $in: [specialty] } }
          ]
        }
      },
      // Reviews ophalen (alleen goedgekeurd)
      {
        $lookup: {
          from: "reviews",
          let: { companyId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$company", "$$companyId"] },
                isApproved: true
              }
            },
            { $project: { rating: 1 } }
          ],
          as: "reviews"
        }
      },
      // Review-metrics
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              null
            ]
          }
        }
      },
      // Opschonen
      {
        $project: {
          password: 0,
          reviews: 0
        }
      }
    ];

    let companies = await Company.aggregate(pipeline);

    // Ranking (uitgebreid)
    companies.sort((a, b) => {
      // 1) zelfde stad eerst
      const aLocal = a.city === city;
      const bLocal = b.city === city;
      if (aLocal !== bLocal) return aLocal ? -1 : 1;

      // 2) bedrijven met reviews eerst
      const aHasReviews = (a.reviewCount || 0) > 0;
      const bHasReviews = (b.reviewCount || 0) > 0;
      if (aHasReviews !== bHasReviews) return aHasReviews ? -1 : 1;

      // 3) hoogste gemiddelde rating
      const aRating = a.averageRating ?? -1;
      const bRating = b.averageRating ?? -1;
      if (aRating !== bRating) return bRating - aRating;

      // 4) meeste reviews
      const aCnt = a.reviewCount || 0;
      const bCnt = b.reviewCount || 0;
      if (aCnt !== bCnt) return bCnt - aCnt;

      // 5) heeft specialismen
      const aHasSpecs = Array.isArray(a.specialties) && a.specialties.length > 0;
      const bHasSpecs = Array.isArray(b.specialties) && b.specialties.length > 0;
      if (aHasSpecs !== bHasSpecs) return aHasSpecs ? -1 : 1;

      // 6) alfabetisch
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
  error: error.message,
  stack: error.stack
});

  }
});

module.exports = router;
