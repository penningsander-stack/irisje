// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const PublicRequest = require("../models/request");
const Company = require("../models/rompany");

// GET /api/publicRequests/:id
router.get("/:id", async (req, res) => {
  try {
    const request = await PublicRequest.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Bestaande matchinglogica (zoals je die al had)
    const companies = await Company.find({
      sector: request.sector,
      city: request.city
    }).lean();

    let startCompany = null;

    // 1️⃣ Probeer startbedrijf via companyId
    if (request.companyId) {
      startCompany = companies.find(
        c => String(c._id) === String(request.companyId)
      );
    }

    // 2️⃣ Fallback: via slug
    if (!startCompany && request.companySlug) {
      startCompany = companies.find(
        c => c.slug === request.companySlug
      );
    }

    // 3️⃣ Als nog niet gevonden: expliciet ophalen uit DB
    if (!startCompany && request.companyId) {
      startCompany = await Company.findById(request.companyId).lean();
    }

    // 4️⃣ Startbedrijf bovenaan zetten en duplicaat verwijderen
    let finalCompanies = companies;
    if (startCompany) {
      finalCompanies = [
        startCompany,
        ...companies.filter(c => String(c._id) !== String(startCompany._id))
      ];
    }

    return res.json({
      request: {
        ...request,
        startCompany: startCompany || null
      },
      companies: finalCompanies
    });

  } catch (err) {
    console.error("publicRequests error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
