// backend/routes/publicrequests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");

// aanvraag aanmaken (public)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
      category,
      categories,
      specialty,
      specialties,
      companySlug,
    } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ ok: false, message: "Naam en e-mail zijn verplicht." });
    }

    const cleanedCompanySlug = companySlug ? String(companySlug).trim() : null;

    const request = new Request({
      name: String(name).trim(),
      email: String(email).trim(),
      message: message ? String(message).trim() : "",

      category: category ? String(category).trim() : "",
      categories: Array.isArray(categories) ? categories.map((c) => String(c).trim()).filter(Boolean) : [],

      specialty: specialty ? String(specialty).trim() : "",
      specialties: Array.isArray(specialties) ? specialties.map((s) => String(s).trim()).filter(Boolean) : [],

      companySlug: cleanedCompanySlug || null,
      status: "Concept",
    });

    await request.save();

    return res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("publicrequests post error:", err);
    return res.status(500).json({ ok: false, message: "Aanvraag opslaan mislukt." });
  }
});

// aanvraag ophalen (public)
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    return res.json({ ok: true, request });
  } catch (err) {
    console.error("publicrequests get error:", err);
    return res.status(500).json({ ok: false, message: "Aanvraag ophalen mislukt." });
  }
});

// aanvraag versturen (public)
router.post("/:id/submit", async (req, res) => {
  try {
    const { companyIds } = req.body || {};

    if (!Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({ ok: false, message: "Geen bedrijven opgegeven." });
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });

    request.selectedCompanies = companyIds;
    request.status = "Verstuurd";
    await request.save();

    return res.json({ ok: true, created: companyIds.length });
  } catch (err) {
    console.error("publicrequests submit error:", err);
    return res.status(500).json({ ok: false, message: "Versturen mislukt." });
  }
});

module.exports = router;
