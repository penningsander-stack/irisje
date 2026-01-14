// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

// modellen (gebruik exact de casing zoals die in jouw repo bestaat)
const Request = require("../models/Request");
const Company = require("../models/Company");

// GET /api/publicRequests/:id
router.get("/:id", async (req, res) => {
  try {
    // 1) aanvraag ophalen
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "request not found" });
    }

    // 2) bedrijven ophalen (laat dit gelijk aan jouw bestaande logica)
    const companies = await Company.find({
      sector: request.sector,
      city: request.city
    }).lean();

    // 3) startbedrijf bepalen
    let startCompany = null;
    const reqCompanyId = request.companyId ? String(request.companyId) : "";
    const reqCompanySlug = request.companySlug ? String(request.companySlug) : "";

    // 3a) match binnen companies via id
    if (reqCompanyId) {
      startCompany =
        companies.find(c => String(c._id) === reqCompanyId) || null;
    }

    // 3b) fallback via slug
    if (!startCompany && reqCompanySlug) {
      startCompany =
        companies.find(c => String(c.slug) === reqCompanySlug) || null;
    }

    // 3c) laatste fallback: expliciet uit DB halen
    if (!startCompany && reqCompanyId) {
      try {
        startCompany = await Company.findById(reqCompanyId).lean();
      } catch (e) {
        startCompany = null;
      }
    }

    // 4) startbedrijf bovenaan zetten (zonder duplicaat)
    let finalCompanies = companies;
    if (startCompany) {
      finalCompanies = [
        startCompany,
        ...companies.filter(
          c => String(c._id) !== String(startCompany._id)
        )
      ];
    }

    // 5) response met expliciet startCompany-object
    return res.json({
      request: {
        ...request,
        startCompany: startCompany || null
      },
      companies: finalCompanies
    });

  } catch (err) {
    console.error("publicRequests error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
