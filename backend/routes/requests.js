// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const Request = require("../models/Request");
const Company = require("../models/Company");

/**
 * GET /api/requests
 * Haalt alle aanvragen op die horen bij het bedrijf van de ingelogde gebruiker
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    // Vind het bedrijf van de ingelogde gebruiker
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) {
      return res.status(404).json({ ok: false, error: "Geen bedrijf gevonden voor deze gebruiker" });
    }

    // Haal alle aanvragen van dat bedrijf op
    const requests = await Request.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, requests });
  } catch (err) {
    console.error("requests GET error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

/**
 * POST /api/requests/update-status
 * Past de status van een aanvraag aan
 * body: { requestId, status }
 */
router.post("/update-status", verifyToken, async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!requestId || !status) {
      return res.status(400).json({ ok: false, error: "Ontbrekende velden" });
    }

    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(403).json({ ok: false, error: "Geen toegang" });

    const request = await Request.findOne({ _id: requestId, company: company._id });
    if (!request) return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });

    request.status = status;
    await request.save();

    res.json({ ok: true, message: "Status bijgewerkt" });
  } catch (err) {
    console.error("update-status error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij bijwerken status" });
  }
});

module.exports = router;
