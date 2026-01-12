// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

// Nieuwe aanvraag
router.post("/", async (req, res) => {
  try {
    const { sector, city } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await Request.create({
      sector,
      city: city || ""
    });

    res.json({ requestId: request._id });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

// Aanvraag ophalen + bedrijven matchen
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    let companies = [];

    // 1. Match bedrijven op sector (primair)
    if (request.sector) {
      companies = await Company.find({
        sector: request.sector
      }).lean();
    }

    // 2. Fallback: geen match → alle bedrijven tonen
    if (!companies || companies.length === 0) {
      companies = await Company.find({}).lean();
    }

    res.json({
      request,
      companies
    });
  } catch (err) {
    console.error("publicRequests GET error:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
