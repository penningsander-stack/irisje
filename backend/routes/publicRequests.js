// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/* ======================================================
   A17 – Bedrijf-gecentreerde context (READ ONLY, aggregate-only)
   LET OP: deze route MOET vóór "/:id" staan.
   ====================================================== */

router.get("/companyContext/:companySlug", async (req, res) => {
  try {
    const { companySlug } = req.params;

    if (!companySlug) {
      return res.status(400).json({
        ok: false,
        message: "companySlug ontbreekt"
      });
    }

    // 1) Bronbedrijf ophalen via aggregate (want Company.find/findOne bestaat niet in deze codebase)
    const sourcePipeline = [
      {
        $match: {
          slug: companySlug,
          active: true
        }
      },
      { $limit: 1 },
      {
        $project: {
          name: 1,
          slug: 1,
          city: 1,
          categories: 1,
          specialties: 1
        }
      }
    ];

    const sourceArr = await Company.aggregate(sourcePipeline);
    const sourceCompany = Array.isArray(sourceArr) ? sourceArr[0] : null;

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

    // 2) Kandidaten ophalen via aggregate
    const matchAnd = [
      { active: true },
      { _id: { $ne: sourceCompany._id } },
      { categories: { $in: categories } }
    ];

    // specialties alleen meenemen als bronbedrijf specialties heeft
    if (specialties.length > 0) {
      matchAnd.push({ specialties: { $in: specialties } });
    }

    const candidatesPipeline = [
      { $match: { $and: matchAnd } },
      {
        $project: {
          name: 1,
          slug: 1,
          city: 1,
          categories: 1,
          specialties: 1
        }
      },
      { $limit: 50 }
    ];

    const candidates = await Company.aggregate(candidatesPipeline);

    // 3) Scoren + sorteren: city eerst, daarna overlap specialties
    const sourceCityNorm = String(city).trim().toLowerCase();

    const scored = (Array.isArray(candidates) ? candidates : []).map(c => {
      const cCityNorm = String(c.city || "").trim().toLowerCase();
      const cityMatch = cCityNorm === sourceCityNorm ? 1 : 0;

      const overlap =
        specialties.length > 0 && Array.isArray(c.specialties)
          ? c.specialties.filter(s => specialties.includes(s)).length
          : 0;

      return {
        company: c,
        cityMatch,
        overlap
      };
    });

    scored.sort((a, b) => {
      if (b.cityMatch !== a.cityMatch) return b.cityMatch - a.cityMatch;
      return b.overlap - a.overlap;
    });

    const matches = scored.slice(0, 20).map(s => ({
      id: s.company._id,
      slug: s.company.slug,
      name: s.company.name,
      categories: s.company.categories,
      specialties: s.company.specialties,
      city: s.company.city
    }));

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
      matches,
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
          $and: [
            {
              $or: [
                { category },
                { categories: { $in: [category] } }
              ]
            },
            {
              $or: [
                { specialties: { $exists: false } },
                { specialties: { $size: 0 } },
                { specialties: { $in: [specialty] } }
              ]
            }
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
    const reqCity = String(city).trim().toLowerCase();

    const localCompanies = companies.filter(
      c => String(c.city || "").trim().toLowerCase() === reqCity
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
      if ((b.isVerified ? 1 : 0) !== (a.isVerified ? 1 : 0)) {
        return (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0);
      }

      // 4) Stabiele fallback
      return (a.name || "").localeCompare(b.name || "", "nl", {
        sensitivity: "base"
      });
    });

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

/* ======================================================
   A16.2 – Bevestiging verzonden aanvraag (read-only)
   ====================================================== */

router.get("/:id/confirmation", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate({
        path: "companies",
        select: "_id name city slug"
      })
      .select("_id companies");

    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden" });
    }

    return res.json({
      ok: true,
      requestId: request._id,
      companies: Array.isArray(request.companies) ? request.companies : []
    });
  } catch (err) {
    console.error("confirmation error:", err);
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

module.exports = router;
