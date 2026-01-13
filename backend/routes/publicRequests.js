// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const PublicRequest = require("../models/Request");
const Company = require("../models/Company");

/**
 * GET /api/publicRequests/:id
 * Haalt aanvraag + gekoppelde bedrijven op
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await PublicRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    let companies = [];

    // Als aanvraag al verzonden is → gekoppelde bedrijven ophalen
    if (Array.isArray(request.companyIds) && request.companyIds.length > 0) {
      companies = await Company.find({
        _id: { $in: request.companyIds }
      });
    }

    res.json({ request, companies });
  } catch (err) {
    res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests
 * Nieuwe aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { sector, city, companySlug } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await PublicRequest.create({
      sector,
      city: city || "",
      companySlug: companySlug || null,
      status: "draft",
      companyIds: []
    });

    res.json({ requestId: request._id });
  } catch (err) {
    res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests/:id/send
 * Aanvraag definitief verzenden naar geselecteerde bedrijven
 */
router.post("/:id/send", async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: "Geen bedrijven geselecteerd" });
    }

    if (companyIds.length > 5) {
      return res.status(400).json({ error: "Maximaal 5 bedrijven toegestaan" });
    }

    const request = await PublicRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    request.companyIds = companyIds;
    request.status = "sent";
    await request.save();

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
