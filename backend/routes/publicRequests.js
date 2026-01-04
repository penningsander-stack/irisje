// backend/routes/publicRequests.js
// Publieke routes voor aanvragen + bedrijfsmatching
// v2026-01-04 MATCHING-CONFIGURABLE

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * =========================
 * Matching-config (EEN PLEK)
 * =========================
 * Pas hier gewichten en gedrag aan — geen logica elders wijzigen.
 */
const MATCHING_CONFIG = {
  MAX_RESULTS: 5,
  WEIGHTS: {
    category: 100,
    specialty: 30,
    region: 10,
  },
  FALLBACKS: {
    ignoreSpecialtiesIfShort: true,
    ignoreRegionsIfShort: true,
  },
  TIE_BREAKER: "createdAtAsc", // deterministisch
};

/**
 * Helper: overlap tellen tussen twee arrays (veilig)
 */
function overlapCount(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const setB = new Set(b);
  let count = 0;
  for (const x of a) if (setB.has(x)) count++;
  return count;
}

/**
 * Helper: score berekenen
 */
function computeScore(company, request, options = {}) {
  const {
    useSpecialties = true,
    useRegions = true,
  } = options;

  const catOverlap = overlapCount(company.categories, request.categories);
  if (catOverlap === 0) return null; // harde filter: categorie vereist

  let score = catOverlap * MATCHING_CONFIG.WEIGHTS.category;

  if (useSpecialties && Array.isArray(request.specialties) && request.specialties.length) {
    const s = overlapCount(company.specialties, request.specialties);
    score += s * MATCHING_CONFIG.WEIGHTS.specialty;
  }

  if (useRegions && Array.isArray(request.regions) && request.regions.length) {
    const r = overlapCount(company.regions, request.regions);
    score += r * MATCHING_CONFIG.WEIGHTS.region;
  }

  return {
    score,
    details: {
      catOverlap,
      specOverlap: useSpecialties ? overlapCount(company.specialties, request.specialties) : 0,
      regOverlap: useRegions ? overlapCount(company.regions, request.regions) : 0,
    },
  };
}

/**
 * Core matching-functie (deterministisch, zonder compound indexen)
 */
async function matchCompaniesForRequest(request) {
  // 1) Basisselectie: categorie-overlap (hard filter)
  const baseCompanies = await Company.find({
    categories: { $in: request.categories },
  }).lean();

  // 2) Eerste pass: alles mee
  let scored = [];
  for (const c of baseCompanies) {
    const res = computeScore(c, request, { useSpecialties: true, useRegions: true });
    if (res) {
      scored.push({
        company: c,
        score: res.score,
        details: res.details,
      });
    }
  }

  // Sorteren
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (MATCHING_CONFIG.TIE_BREAKER === "createdAtAsc") {
      return new Date(a.company.createdAt) - new Date(b.company.createdAt);
    }
    return 0;
  });

  // Fallback 1: zonder specialismes
  if (
    scored.length < MATCHING_CONFIG.MAX_RESULTS &&
    MATCHING_CONFIG.FALLBACKS.ignoreSpecialtiesIfShort
  ) {
    scored = [];
    for (const c of baseCompanies) {
      const res = computeScore(c, request, { useSpecialties: false, useRegions: true });
      if (res) {
        scored.push({
          company: c,
          score: res.score,
          details: res.details,
        });
      }
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.company.createdAt) - new Date(b.company.createdAt);
    });
  }

  // Fallback 2: zonder regio’s
  if (
    scored.length < MATCHING_CONFIG.MAX_RESULTS &&
    MATCHING_CONFIG.FALLBACKS.ignoreRegionsIfShort
  ) {
    scored = [];
    for (const c of baseCompanies) {
      const res = computeScore(c, request, { useSpecialties: false, useRegions: false });
      if (res) {
        scored.push({
          company: c,
          score: res.score,
          details: res.details,
        });
      }
    }
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.company.createdAt) - new Date(b.company.createdAt);
    });
  }

  // Max 5
  return scored.slice(0, MATCHING_CONFIG.MAX_RESULTS);
}

/**
 * GET /api/publicRequests/:id
 * Geeft aanvraag + gematchte bedrijven terug
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    }

    // Veilig defaults
    request.categories = request.categories || [];
    request.specialties = request.specialties || [];
    request.regions = request.regions || [];

    const matches = await matchCompaniesForRequest(request);

    // Logging (debugbaar)
    console.info("[publicRequests] match", {
      requestId: request._id.toString(),
      count: matches.length,
      companies: matches.map(m => ({
        companyId: m.company._id.toString(),
        score: m.score,
        details: m.details,
      })),
    });

    return res.json({
      ok: true,
      request,
      companies: matches.map(m => ({
        ...m.company,
        _matchScore: m.score,
        _matchDetails: m.details,
      })),
    });
  } catch (err) {
    console.error("❌ publicRequests:", err);
    return res.status(500).json({ ok: false, message: "Interne fout." });
  }
});

module.exports = router;
