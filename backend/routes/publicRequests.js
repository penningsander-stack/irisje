const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * POST /api/publicRequests
 * Wizard stap 1: maak tijdelijke aanvraag aan
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
      status: "Concept",
    });

    return res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("❌ publicRequests POST error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

/**
 * GET /api/publicRequests/:id
 * Results: haal tijdelijke aanvraag + matchende bedrijven op
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
 * Vertaal wizard-aanvraag naar losse Request-records (per bedrijf)
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

    const baseRequest = await Request.findById(req.params.id).lean();
    if (!baseRequest) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    const companies = await Company.find({ _id: { $in: companyIds } }).lean();
    if (companies.length !== companyIds.length) {
      return res.status(400).json({ ok: false, error: "Ongeldige bedrijfsselectie." });
    }

    // Maak per bedrijf een aparte aanvraag aan (zoals dashboard verwacht)
    const createdRequests = [];

    for (const companyId of companyIds) {
      const r = await Request.create({
        name: baseRequest.name,
        email: baseRequest.email,
        message: baseRequest.message,
        category: baseRequest.category,
        specialty: baseRequest.specialty,

        company: companyId,        // 🔑 cruciaal
        status: "Nieuw",
      });

      createdRequests.push(r._id);
    }

    return res.json({
      ok: true,
      created: createdRequests.length,
    });
  } catch (err) {
    console.error("❌ publicRequests submit error:", err);
    return res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

module.exports = router;
