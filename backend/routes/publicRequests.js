// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const PublicRequest = require("../models/request");
const Company = require("../models/company");

/**
 * GET /api/publicRequests/:id
 * Haalt aanvraag + bijpassende bedrijven op
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await PublicRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    let companies = [];

    // 1️⃣ Als aanvraag al verzonden is → vaste selectie
    if (Array.isArray(request.companyIds) && request.companyIds.length > 0) {
      companies = await Company.find({
        _id: { $in: request.companyIds },
        active: true
      });
    }
    // 2️⃣ Nieuwe aanvraag → match op sector
    else {
      companies = await Company.find({
        active: true,
        categories: request.sector
      }).limit(200); // veiligheidslimiet
    }

    res.json({ request, companies });
  } catch (err) {
    console.error("publicRequests GET error:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests
 * Nieuwe aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { sector, city, companySlug, name, email, message } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await PublicRequest.create({
      sector,
      city: city || "",
      companySlug: companySlug || null,
      name: name || "",
      email: email || "",
      message: message || "",
      status: "draft",
      companyIds: []
    });

    res.json({ requestId: request._id });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests/:id/send
 * Aanvraag definitief verzenden
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
    console.error("publicRequests SEND error:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
