const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/*
  POST /api/publicRequests
  - Public aanvraag aanmaken
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
      category: finalSector,
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
  - Bedrijven ophalen
  - Reviews via aggregation
  - ÉÉN centrale sortering (definitief)
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

    // -------------------------
    // Aggregation: bedrijven + reviews
    // -------------------------
    const pipeline = [
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
      {
        $project: {
          reviews: 0,
          password: 0
        }
      }
    ];

    const companies = await Company.aggregate(pipeline);

    // -------------------------
    // Plaats-fallback
    // -------------------------
    const reqCity = city.trim().toLowerCase();
    const localCompanies = companies.filter(
      c => (c.city || "").trim().toLowerCase() === reqCity
    );

    const hasLocal = localCompanies.length > 0;
    const finalCompanies = hasLocal ? localCompanies : companies;

    // -------------------------
    // DEFINITIEVE SORTERING
    // -------------------------
    finalCompanies.sort((a, b) => {
      // 1) Irisje reviews
      const aHasIrisje = Number.isFinite(a.averageRating) && a.reviewCount > 0;
      const bHasIrisje = Number.isFinite(b.averageRating) && b.reviewCount > 0;
      if (aHasIrisje !== bHasIrisje) return aHasIrisje ? -1 : 1;

      if (aHasIrisje && bHasIrisje) {
        if (b.averageRating !== a.averageRating)
          return b.averageRating - a.averageRating;
        if ((b.reviewCount || 0) !== (a.reviewCount || 0))
          return (b.reviewCount || 0) - (a.reviewCount || 0);
      }

      // 2) Google reviews
      const aHasGoogle = Number.isFinite(a.avgRating);
      const bHasGoogle = Number.isFinite(b.avgRating);
      if (aHasGoogle !== bHasGoogle) return aHasGoogle ? -1 : 1;

      if (aHasGoogle && bHasGoogle) {
        if (b.avgRating !== a.avgRating)
          return b.avgRating - a.avgRating;
      }

      // 3) Verificatie
      const aVer = a.isVerified ? 1 : 0;
      const bVer = b.isVerified ? 1 : 0;
      if (aVer !== bVer) return bVer - aVer;

      // 4) Stabiele fallback
      return (a.name || "").localeCompare(b.name || "", "nl", {
        sensitivity: "base"
      });
    });

    // -------------------------
    // Response
    // -------------------------
    return res.json({
      ok: true,
      noLocalResults: !hasLocal,
      request: {
        _id: request._id,
        sector: category,
        specialty: request.specialty,
        city: request.city
      },
      companies: finalCompanies
    });
  } catch (error) {
    console.error("publicRequests GET error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});

module.exports = router;
