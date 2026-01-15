// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

/**
 * POST /api/publicRequests
 * Publieke aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { category, sector, city, description } = req.body || {};

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
      requestId: request._id
    });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/publicRequests/latest
 * Haalt de laatst aangemaakte publieke aanvraag op
 * + alle bedrijven
 */
router.get("/latest", async (req, res) => {
  try {
    const request = await requestModel
      .findOne({})
      .sort({ createdAt: -1 })
      .lean();

    if (!request) {
      return res.status(404).json({ error: "no requests found" });
    }

    const companies = await companyModel.find({}).lean();

    return res.json({
      request,
      companies
    });
  } catch (err) {
    console.error("publicRequests latest error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/publicRequests/:id
 * Haalt specifieke aanvraag + bedrijven op
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Voorkom Mongo-crash bij ongeldige id
    if (!id || id.length < 12) {
      return res.status(400).json({ error: "invalid request id" });
    }

    const request = await requestModel.findById(id).lean();
    if (!request) {
      return res.status(404).json({ error: "request not found" });
    }

    const companies = await companyModel.find({}).lean();

    // Startbedrijf bepalen (optioneel)
    let startCompany = null;

    if (request.companyId) {
      startCompany =
        companies.find(c => String(c._id) === String(request.companyId)) || null;
    }

    if (!startCompany && request.companySlug) {
      startCompany =
        companies.find(c => String(c.slug) === String(request.companySlug)) ||
        null;
    }

    if (startCompany) {
      return res.json({
        request: {
          ...request,
          startCompany
        },
        companies: [
          startCompany,
          ...companies.filter(
            c => String(c._id) !== String(startCompany._id)
          )
        ]
      });
    }

    return res.json({
      request,
      companies
    });
  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
