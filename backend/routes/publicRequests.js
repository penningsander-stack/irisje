// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Request = require("../models/Request");

/**
 * POST /api/publicRequests/submit
 * Publieke offerte-aanvraag voor een bedrijf
 * body: { slug or companyId, name, email, message }
 */
router.post("/submit", async (req, res) => {
  try {
    const { slug, companyId, name, email, message } = req.body || {};

    if (!name || !email || !message || (!slug && !companyId)) {
      return res.status(400).json({ ok: false, error: "Ontbrekende velden" });
    }

    // Vind bedrijf op slug of ID
    let company = null;
    if (slug) {
      company = await Company.findOne({ slug });
    } else if (companyId) {
      company = await Company.findById(companyId);
    }

    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    // Maak de aanvraag aan
    const reqDoc = await Request.create({
      company: company._id,
      name,
      email,
      message,
      status: "Nieuw",
    });

    console.log("✅ Nieuwe aanvraag opgeslagen voor bedrijf:", company.name);

    res.json({
      ok: true,
      message: "Aanvraag verzonden",
      id: reqDoc._id,
      company: company.slug,
    });
  } catch (err) {
    console.error("publicRequests/submit error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij indienen aanvraag" });
  }
});

/**
 * GET /api/publicRequests/test
 * Testroute om te controleren of aanvragen bestaan
 */
router.get("/test", async (_req, res) => {
  try {
    const all = await Request.find().populate("company", "name slug");
    res.json({ ok: true, count: all.length, requests: all });
  } catch (err) {
    console.error("publicRequests/test error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij testaanvragen" });
  }
});

module.exports = router;
