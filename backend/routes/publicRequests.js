// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/* ======================================================
   A17 – Bedrijf-gecentreerde context (READ ONLY)
   MOET VOOR /:id KOMEN
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

    const sourceCompany = await Company.findOne({
      slug: companySlug,
      active: true
    })
      .select("name slug city categories specialties")
      .lean();

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

    const match = {
      active: true,
      _id: { $ne: sourceCompany._id },
      categories: { $in: categories }
    };

    if (specialties.length > 0) {
      match.specialties = { $in: specialties };
    }

    const candidates = await Company.find(match)
      .select("name slug city categories specialties")
      .limit(50)
      .lean();

    const sourceCityNorm = String(city).trim().toLowerCase();

    const scored = candidates.map(c => {
      const cCityNorm = String(c.city || "").trim().toLowerCase();
      const cityMatch = cCityNorm === sourceCityNorm ? 1 : 0;

      const overlap =
        specialties.length > 0 && Array.isArray(c.specialties)
          ? c.specialties.filter(s => specialties.includes(s)).length
          : 0;

      return { company: c, cityMatch, overlap };
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

/* ======================================================
   POST /api/publicRequests
   ====================================================== */

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
      city: city.trim()
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

/* ======================================================
   GET /api/publicRequests/:id
   ====================================================== */

router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();

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

    // ✅ A17.7 – city normalisatie (case-insensitive, exact match)
    const cityRegex = new RegExp(`^${city.trim()}$`, "i");

    const companies = await Company.find({
  active: true,
  city: city,
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
}).lean();


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
      error: error.message
    });
  }
});

/* ======================================================
   A16.2 – Bevestiging verzonden aanvraag
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
      return res.status(404).json({
        ok: false,
        message: "Aanvraag niet gevonden"
      });
    }

    return res.json({
      ok: true,
      requestId: request._id,
      companies: Array.isArray(request.companies) ? request.companies : []
    });
  } catch (err) {
    console.error("confirmation error:", err);
    return res.status(500).json({
      ok: false,
      message: "Serverfout"
    });
  }
});

module.exports = router;
