// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const Company = require("../models/company");

// GET aanvraag + matches (bestond al)
router.get("/:id", async (req, res) => {
  try {
    console.log("🔥 publicRequests route HIT");

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    console.log("🔥 MATCH sector:", request.sector);

    const companies = await Company.find({
      sector: new RegExp(`^${request.sector}$`, "i"),
    });

    console.log("🔥 FOUND companies:", companies.length);

    res.json({ request, companies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Serverfout" });
  }
});

// ✅ NIEUW: selectie opslaan
router.post("/:id/submit", async (req, res) => {
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
    request.status = "submitted";

    await request.save();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Opslaan mislukt" });
  }
});

module.exports = router;
