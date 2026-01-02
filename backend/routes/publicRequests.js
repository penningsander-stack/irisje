// backend/routes/publicRequests.js
// v20260102-step14d-FINAL
// Publieke aanvragen + matching op category + specialty
// GEEN city / postcode / geo
// LET OP: models zijn lowercase (Linux case-sensitive)

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const Request = require("../models/request.js");

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

    // Aanvraag opslaan
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

    // Matching: alleen category + specialty
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
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij verwerken aanvraag",
    });
  }
});

module.exports = router;
