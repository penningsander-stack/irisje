// backend/routes/publicRequests.js
// G1: server-side max-selectie guard

const express = require("express");
const router = express.Router();
const Request = require("../models/request");

// CREATE
router.post("/", async (req, res) => {
  try {
    const {
      name, email, message,
      category, categories,
      specialty, specialties,
      companySlug,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ ok: false, message: "Naam en e-mail zijn verplicht." });
    }

    const request = new Request({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      message: message ? String(message).trim() : "",
      category: category ? String(category).trim() : "",
      categories: Array.isArray(categories) ? categories.map(String).map(s=>s.trim()).filter(Boolean) : [],
      specialty: specialty ? String(specialty).trim() : "",
      specialties: Array.isArray(specialties) ? specialties.map(String).map(s=>s.trim()).filter(Boolean) : [],
      companySlug: companySlug ? String(companySlug).trim() : null,
      status: "Concept",
    });

    await request.save();
    res.json({ ok: true, requestId: request._id });
  } catch (e) {
    console.error("publicrequests post error:", e);
    res.status(500).json({ ok: false, message: "Aanvraag opslaan mislukt." });
  }
});

// READ
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    res.json({ ok: true, request });
  } catch (e) {
    console.error("publicrequests get error:", e);
    res.status(500).json({ ok: false, message: "Aanvraag ophalen mislukt." });
  }
});

// SUBMIT (HARD GUARD)
router.post("/:id/submit", async (req, res) => {
  try {
    let { companyIds } = req.body || {};
    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ ok: false, message: "Geen bedrijven opgegeven." });
    }

    // dedupe
    companyIds = Array.from(new Set(companyIds.map(String)));

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });

    const hasStart = !!request.companySlug;

    // totaal max 5
    if (companyIds.length > 5) {
      return res.status(400).json({
        ok: false,
        message: "Maximaal 5 bedrijven toegestaan.",
      });
    }

    // bij startbedrijf: max 4 extra
    if (hasStart && companyIds.length > 4) {
      return res.status(400).json({
        ok: false,
        message: "Met een startbedrijf kun je maximaal 4 extra bedrijven selecteren.",
      });
    }

    request.selectedCompanies = companyIds;
    request.status = "Verstuurd";
    await request.save();

    res.json({ ok: true, created: companyIds.length });
  } catch (e) {
    console.error("publicrequests submit error:", e);
    res.status(500).json({ ok: false, message: "Versturen mislukt." });
  }
});

module.exports = router;
