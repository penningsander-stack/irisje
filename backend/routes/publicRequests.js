// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * POST /api/publicRequests
 * Wizard stap 1: maak aanvraag aan
 * Body verwacht o.a.:
 * { name, email, message, category, specialty }
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, message, category, specialty } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Onvolledige aanvraag." });
    }

    const request = await Request.create({
      name,
      email,
      message,
      category: category || "",
      specialty: specialty || "",
      categories: category ? [category] : [],
      specialties: specialty ? [specialty] : [],
      status: "Nieuw",
    });

    return res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("❌ publicRequests POST error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

/**
 * GET /api/publicRequests/:id
 * Results: haal aanvraag + gematchte bedrijven op
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    const category = (request.category || "").toLowerCase();
    const specialty = (request.specialty || "").toLowerCase();

    const query = {};
    if (category) query.categories = category;
    if (specialty) query.specialties = specialty;

    const companies = await Company.find(query).lean();

    return res.json({ ok: true, request, companies });
  } catch (err) {
    console.error("❌ publicRequests GET error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

/**
 * POST /api/publicRequests/:id/submit
 * B2: sla geselecteerde bedrijven op en zet status naar "Verstuurd"
 * Body: { companyIds: [] }
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
