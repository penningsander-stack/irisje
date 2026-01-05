// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

// bestaande routes blijven ongewijzigd hierboven

/**
 * B2: selectie versturen
 * POST /api/publicRequests/:id/submit
 * body: { companyIds: [] }
 */
router.post("/:id/submit", async (req, res) => {
  try {
    const { companyIds } = req.body || {};
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ ok: false, error: "Geen bedrijven geselecteerd." });
    }
    if (companyIds.length > 5) {
      return res.status(400).json({ ok: false, error: "Maximaal 5 bedrijven toegestaan." });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    // controleer of bedrijven bestaan
    const count = await Company.countDocuments({ _id: { $in: companyIds } });
    if (count !== companyIds.length) {
      return res.status(400).json({ ok: false, error: "Ongeldige bedrijfsselectie." });
    }

    request.selectedCompanies = companyIds;
    request.status = "Verstuurd";
    await request.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ submit error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

module.exports = router;
