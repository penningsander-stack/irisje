// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * POST /api/publicRequests
 * Nieuwe aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { sector, city } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await Request.create({
      sector,
      city: city || "",
      status: "draft",
      selectedCompanies: []
    });

    return res.json({ requestId: request._id });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * GET /api/publicRequests/:id
 * Aanvraag ophalen + bedrijven matchen op sector
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    let companies = [];

    // 🔒 Strikte sector-matching
    if (request.sector) {
      companies = await Company.find({
        sector: request.sector
      }).lean();
    }

    // ❗ GEEN fallback naar andere sectoren
    if (!Array.isArray(companies)) {
      companies = [];
    }

    return res.json({
      request,
      companies
    });
  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({ error: "Serverfout" });
  }
});

/**
 * POST /api/publicRequests/:id/send
 * Geselecteerde bedrijven opslaan
 */
router.post("/:id/send", async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ error: "Geen bedrijven geselecteerd" });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    request.selectedCompanies = companyIds;
    request.status = "sent";
    request.sentAt = new Date();

    await request.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("publicRequests SEND error:", err);
    return res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
