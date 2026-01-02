// backend/routes/publicRequests.js
// v20260102-step14d
// Publieke aanvragen + matching op category + specialty (GEEN locatie)

const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Request = require("../models/Request");

// POST /api/publicRequests
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
      category,
      specialty,
      experience,
      approach,
      involvement,
    } = req.body;

    if (!name || !email || !category) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mail en categorie zijn verplicht",
      });
    }

    // ✅ Aanvraag opslaan
    const request = await Request.create({
      name,
      email,
      message,
      category,
      specialty,
      experience,
      approach,
      involvement,
      status: "Nieuw",
      source: "public",
    });

    // ✅ MATCHING – GEEN locatie
    const companyQuery = {
      category,
      active: true,
    };

    if (specialty) {
      companyQuery.specialties = specialty;
    }

    const companies = await Company.find(companyQuery)
      .limit(20)
      .select("_id name city rating premium");

    return res.json({
      ok: true,
      requestId: request._id,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij public request:", err);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij verwerken aanvraag",
    });
  }
});

module.exports = router;
