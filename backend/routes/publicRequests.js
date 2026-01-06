// backend/routes/publicRequests.js
const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * POST /api/publicRequests
 * Wizard stap 1 + 2: maak aanvraag aan
 * Body verwacht o.a.:
 * {
 *   name, email, message,
 *   category, specialty,
 *   issueType, urgency, stage, budgetRange, contactPreference
 * }
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      message,
      category,
      specialty,
      issueType,
      urgency,
      stage,
      budgetRange,
      contactPreference,
    } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Naam, e-mail en bericht zijn verplicht.",
      });
    }

    const request = await Request.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      message: String(message).trim(),

      category: category || "",
      specialty: specialty || "",

      categories: category ? [category] : [],
      specialties: specialty ? [specialty] : [],

      issueType: issueType || "",
      urgency: urgency || "",
      stage: stage || "",
      budgetRange: budgetRange || "",
      contactPreference: contactPreference || "",

      status: "Nieuw",
    });

    return res.json({ ok: true, requestId: request._id });
  } catch (err) {
    console.error("❌ publicRequests POST error:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij opslaan van de aanvraag.",
    });
  }
});

/**
 * GET /api/publicRequests/:id
 * Results: haal aanvraag + gematchte bedrijven op (met score)
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res
        .status(404)
        .json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    const category = (request.category || "").toLowerCase();
    const specialty = (request.specialty || "").toLowerCase();

    const query = {};
    if (category) query.categories = category;
    if (specialty) query.specialties = specialty;

    const companies = await Company.find(query).lean();

    const scoredCompanies = companies.map((company) => ({
      ...company,
      _score: computeScore(company, request),
    }));

    scoredCompanies.sort((a, b) => b._score - a._score);

    return res.json({
      ok: true,
      request,
      companies: scoredCompanies,
    });
  } catch (err) {
    console.error("❌ publicRequests GET error:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen van resultaten.",
    });
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
      return res.status(400).json({
        ok: false,
        error: "Selecteer minimaal één bedrijf.",
      });
    }

    if (companyIds.length > 5) {
      return res.status(400).json({
        ok: false,
        error: "Maximaal 5 bedrijven toegestaan.",
      });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res
        .status(404)
        .json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    const validCount = await Company.countDocuments({
      _id: { $in: companyIds },
    });

    if (validCount !== companyIds.length) {
      return res.status(400).json({
        ok: false,
        error: "Eén of meer geselecteerde bedrijven zijn ongeldig.",
      });
    }

    request.selectedCompanies = companyIds;
    request.status = "Verstuurd";
    await request.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ publicRequests submit error:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij versturen van de aanvraag.",
    });
  }
});

/**
 * Interne helper: matchscore berekenen
 */
function computeScore(company, request) {
  let score = 0;

  // Specialisme (basis)
  if (company.specialties?.includes(request.specialty)) {
    score += 40;
  }

  // IssueType
  if (
    request.issueType &&
    company.issueTypes?.includes(request.issueType)
  ) {
    score += 25;
  }

  // Urgentie
  if (request.urgency === "direct" && company.canHandleUrgent) {
    score += 15;
  }

  // Budget
  if (
    request.budgetRange &&
    company.budgetRanges?.includes(request.budgetRange)
  ) {
    score += 10;
  }

  // Reviews (lichte normalisatie)
  if (company.rating) {
    score += Math.round(company.rating * 2);
  }

  return score;
}

module.exports = router;
