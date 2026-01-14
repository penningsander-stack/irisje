// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

/**
 * POST /api/publicRequests
 * Doel: publieke aanvraag aanmaken (minimaal).
 * - Slaat aanvraag op
 * - Geeft _id terug
 * - Geen matching, geen e-mail, geen extra logica
 */
router.post("/", async (req, res) => {
  try {
    const { category, sector, city, description } = req.body || {};

    // Minimale validatie
    if (!city || (!category && !sector)) {
      return res.status(400).json({
        error: "missing required fields"
      });
    }

    const request = await requestModel.create({
      category: category || sector,
      sector: sector || category,
      city,
      description: description || ""
    });

    return res.json({
      _id: request._id
    });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

// GET /api/publicRequests/:id
router.get("/:id", async (req, res) => {
  try {
    // 1) aanvraag ophalen
    const request = await requestModel.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "request not found" });
    }

    // 2) bedrijven ophalen
    // BELANGRIJK:
    // - GEEN sector/city filtering hier
    // - deze endpoint moet altijd bedrijven kunnen tonen
    const companies = await companyModel.find({}).lean();

    // 3) startbedrijf bepalen (optioneel)
    let startCompany = null;
    const reqCompanyId = request.companyId ? String(request.companyId) : "";
    const reqCompanySlug = request.companySlug ? String(request.companySlug) : "";

    if (reqCompanyId) {
      startCompany =
        companies.find(c => String(c._id) === reqCompanyId) || null;
    }

    if (!startCompany && reqCompanySlug) {
      startCompany =
        companies.find(c => String(c.slug) === reqCompanySlug) || null;
    }

    if (!startCompany && reqCompanyId) {
      try {
        startCompany = await companyModel.findById(reqCompanyId).lean();
      } catch {
        startCompany = null;
      }
    }

    // 4) startbedrijf bovenaan zetten (geen duplicaat)
    let finalCompanies = companies;
    if (startCompany) {
      finalCompanies = [
        startCompany,
        ...companies.filter(
          c => String(c._id) !== String(startCompany._id)
        )
      ];
    }

    // 5) response
    return res.json({
      request: {
        ...request,
        startCompany: startCompany || null
      },
      companies: finalCompanies
    });

  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
