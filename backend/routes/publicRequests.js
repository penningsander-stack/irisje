// backend/routes/publicRequests.js
// v20260102-step14d-FINAL-FIX
// Publieke aanvragen + matching op category + specialty
// GEEN city / postcode / geo
// Models zijn lowercase (Linux case-sensitive)

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const Request = require("../models/request.js");

/**
 * POST /api/publicRequests
 * Maakt een publieke aanvraag aan + eerste matching
 */
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
    console.error("❌ Fout bij public request (POST):", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij verwerken aanvraag",
    });
  }
});

/**
 * GET /api/publicRequests/:id
 * Haalt bestaande aanvraag op + matching voor select-companies pagina
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Request.findById(id).lean();

    if (!request) {
      return res.status(404).json({
        ok: false,
        error: "Aanvraag niet gevonden",
      });
    }

    // Matching: alleen category + specialty
    const companyQuery = {
      category: request.category,
      active: true,
    };

    if (request.specialty) {
      companyQuery.specialties = request.specialty;
    }

    const companies = await Company.find(companyQuery)
      .limit(20)
      .select("_id name city rating premium");

    return res.json({
      ok: true,
      request,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij public request (GET):", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen aanvraag",
    });
  }
});

module.exports = router;
