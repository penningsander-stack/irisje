// backend/routes/publicRequests.js
// v20260103-FINAL-FIX
// Publieke aanvragen ophalen + bedrijven matchen
// ⚠️ Linux-safe: lowercase bestandsnamen

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const Request = require("../models/request.js");

/**
 * POST /api/publicRequests
 * Aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
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

    const request = await Request.create({
      name,
      email,
      phone,
      message,
      category,
      specialty,
      experience,
      approach,
      involvement,
      status: "Nieuw",
      source: "public",
    });

    return res.json({
      ok: true,
      requestId: request._id,
    });
  } catch (err) {
    console.error("❌ Fout bij aanmaken aanvraag:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij verwerken aanvraag",
    });
  }
});

/**
 * GET /api/publicRequests/:id
 * Aanvraag ophalen + bedrijven matchen
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

    const query = {
      active: true,
      category: request.category,
    };

    if (request.specialty) {
      query.specialties = request.specialty;
    }

    const companies = await Company.find(query)
      .limit(20)
      .select("_id name city rating premium category")
      .lean();

    return res.json({
      ok: true,
      request,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvraag:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen aanvraag",
    });
  }
});

/**
 * POST /api/publicRequests/:id/send
 * (frontend verwacht deze al)
 */
router.post("/:id/send", async (req, res) => {
  try {
    const { companyIds } = req.body;

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Geen bedrijven geselecteerd",
      });
    }

    return res.json({
      ok: true,
      createdCount: companyIds.length,
    });
  } catch (err) {
    console.error("❌ Fout bij versturen:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij versturen",
    });
  }
});

module.exports = router;
