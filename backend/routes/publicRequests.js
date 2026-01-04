// backend/routes/publicRequests.js
// v2026-01-06 FIX-SCHEMA-SAFE-POST

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * =========================
 * Matching-config
 * =========================
 */
const MATCHING_CONFIG = {
  MAX_RESULTS: 5,
  WEIGHTS: { category: 100, specialty: 30, region: 10 },
  FALLBACKS: { ignoreSpecialtiesIfShort: true, ignoreRegionsIfShort: true },
};

/**
 * Helpers
 */
const normalizeStr = (s) => String(s || "").trim().toLowerCase();
const normalizeArray = (arr) =>
  Array.isArray(arr) ? arr.map(s => String(s).trim().toLowerCase()).filter(Boolean) : [];

function overlapCount(a = [], b = []) {
  const setB = new Set(b);
  return a.reduce((n, x) => n + (setB.has(x) ? 1 : 0), 0);
}

/**
 * Legacy-normalisatie
 */
function normalizeRequestLegacy(request) {
  const categories = normalizeArray(request.categories);
  const specialties = normalizeArray(request.specialties);

  if (!categories.length && request.category) categories.push(normalizeStr(request.category));
  if (!specialties.length && request.specialty) specialties.push(normalizeStr(request.specialty));

  return { ...request, categories, specialties };
}

/**
 * Score
 */
function computeScore(company, request) {
  const catOverlap = overlapCount(
    normalizeArray(company.categories),
    request.categories
  );
  if (catOverlap === 0) return null;

  let score = catOverlap * MATCHING_CONFIG.WEIGHTS.category;

  if (request.specialties.length) {
    score += overlapCount(
      normalizeArray(company.specialties),
      request.specialties
    ) * MATCHING_CONFIG.WEIGHTS.specialty;
  }

  return { score };
}

/**
 * Matching
 */
async function matchCompaniesForRequest(request) {
  if (!request.categories.length) return [];

  const baseCompanies = await Company.find({
    categories: { $in: request.categories },
  }).lean();

  const scored = [];

  for (const c of baseCompanies) {
    const r = computeScore(c, request);
    if (r) scored.push({ company: c, score: r.score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MATCHING_CONFIG.MAX_RESULTS);
}

/**
 * POST /api/publicRequests
 * (schema-veilig)
 */
router.post("/", async (req, res) => {
  try {
    const { category, specialty, message, name, email } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Onvoldoende gegevens." });
    }

    const created = await Request.create({
      name,
      email,
      message,
      category,
      specialty,
      status: "Nieuw",
    });

    return res.json({ ok: true, requestId: created._id });
  } catch (err) {
    console.error("❌ publicRequests POST:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * GET /api/publicRequests/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const raw = await Request.findById(req.params.id).lean();
    if (!raw) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    }

    const request = normalizeRequestLegacy(raw);
    const matches = await matchCompaniesForRequest(request);

    return res.json({
      ok: true,
      request,
      companies: matches.map(m => ({ ...m.company, _matchScore: m.score })),
    });
  } catch (err) {
    console.error("❌ publicRequests GET:", err);
    return res.status(500).json({ ok: false, message: "Interne fout." });
  }
});

module.exports = router;
