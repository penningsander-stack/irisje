// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

/**
 * Aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { sector, specialty, city } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await requestModel.create({
      sector,
      specialty: specialty || "",
      city: city || "",
    });

    res.json({ requestId: request._id });
  } catch (err) {
    console.error("POST /publicRequests error:", err);
    res.status(500).json({ error: "Aanvraag kon niet worden aangemaakt" });
  }
});

/**
 * Resultaten ophalen
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await requestModel.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    // MINIMALE filtering: alleen op sector
    const companies = await companyModel
      .find({ sector: request.sector })
      .lean();

    res.json({
      request,
      companies,
    });
  } catch (err) {
    console.error("GET /publicRequests/:id error:", err);
    res.status(500).json({ error: "Resultaten konden niet worden opgehaald" });
  }
});

module.exports = router;
