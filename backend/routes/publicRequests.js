// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/Request");
const Company = require("../models/Company");

// =====================================================
// POST /api/publicRequests
// Start een nieuwe (publieke) aanvraag – lichte variant
// =====================================================
router.post("/", async (req, res) => {
  try {
    const { sector, specialty, city } = req.body;

    if (!sector || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector, specialisme en plaats zijn verplicht."
      });
    }

    const request = await Request.create({
      sector,
      specialty,
      city,
      status: "open"
    });

    res.json({
      ok: true,
      requestId: request._id
    });
  } catch (err) {
    console.error("POST /api/publicRequests fout:", err);
    res.status(500).json({
      ok: false,
      message: "Kon aanvraag niet starten."
    });
  }
});

// =====================================================
// GET /api/publicRequests/:id
// Haal aanvraag + gematchte bedrijven op
// =====================================================
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Aanvraag niet gevonden" });
    }

    // Match bedrijven op sector + plaats
    const companies = await Company.find({
      sector: new RegExp(`^${request.sector}$`, "i"),
      city: new RegExp(`^${request.city}$`, "i"),
      verified: true
    });

    res.json({
      request,
      companies
    });
  } catch (err) {
    console.error("GET /api/publicRequests fout:", err);
    res.status(500).json({ message: "Fout bij ophalen aanvraag" });
  }
});

// =====================================================
// POST /api/publicRequests/:id/submit
// Koppel geselecteerde bedrijven aan aanvraag
// =====================================================
router.post("/:id/submit", async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "Geen bedrijven geselecteerd."
      });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Aanvraag niet gevonden" });
    }

    request.selectedCompanies = companyIds;
    request.status = "submitted";
    await request.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/publicRequests/:id/submit fout:", err);
    res.status(500).json({
      ok: false,
      message: "Kon aanvraag niet verzenden."
    });
  }
});

module.exports = router;
