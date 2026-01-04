// backend/routes/publicRequests.js
// Publieke routes voor aanvragen + bedrijfsmatching
// v2026-01-04 MATCHING-CONFIGURABLE + LEGACY-NORMALIZE

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/**
 * =========================
 * Matching-config (EEN PLEK)
 * =========================
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
  TIE_BREAKER: "createdAtAsc",
};

/**
 * Helpers
 */
function normalizeStr(s) {
  return String(s || "").trim().toLowerCase();
}

function normalizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(s => String(s).trim().toLowerCase()).filter(Boolean);
}

function overlapCount(a = [], b = []) {
  if (!Array.isArray(a) || !Array.isArray(b)) return 0;
  const setB = new Set(b);
  let count = 0;
  for (const x of a) if (setB.has(x)) count++;
  return count;
}

/**
 * Legacy-normalisatie:
 * - category (string) -> categories[]
 * - specialty (string) -> specialties[]
 * Alleen in-memory (geen DB write)
 */
function normalizeRequestLegacy(request) {
  const categories = normalizeArray(request.categories);
  const specialties = normalizeArray(request.specialties);
  const regions = normalizeArray(request.regions);

  if (!categories.length && request.category) {
    categories.push(normalizeStr(request.category));
  }
  if (!specialties.length && request.specialty) {
    specialties.push(normalizeStr(request.specialty));
  }

  return {
    ...request,
    categories,
    specialties,
    regions,
  };
}

/**
 * Score berekenen
 */
function computeScore(company, request, options = {}) {
  const { useSpecialties = true, useRegions = true } = options;

  const companyCategories = normalizeArray(company.categories);
const companySpecialties = normalizeArray(company.specialties);
const companyRegions = normalizeArray(company.regions);

const catOverlap = overlapCount(companyCategories, request.categories);

  if (catOverlap === 0) return null;

  let score = catOverlap * MATCHING_CONFIG.WEIGHTS.category;

  if (useSpecialties && request.specialties.length) {
  const s = overlapCount(companySpecialties, request.specialties);
  score += s * MATCHING_CONFIG.WEIGHTS.specialty;
}

if (useRegions && request.regions.length) {
  const r = overlapCount(companyRegions, request.regions);
  score += r * MATCHING_CONFIG.WEIGHTS.region;
}


  return { score };
}

/**
 * Core matching
 */
async function matchCompaniesForRequest(request) {
  const baseCompanies = await Company.find({
    categories: { $in: request.categories },
  }).lean();

  const sortFn = (a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.company.createdAt) - new Date(b.company.createdAt);
  };

  let scored = [];

  // Pass 1: alles
  for (const c of baseCompanies) {
    const res = computeScore(c, request, { useSpecialties: true, useRegions: true });
    if (res) scored.push({ company: c, score: res.score });
  }
  scored.sort(sortFn);

  // Fallback 1: zonder specialismes
  if (scored.length < MATCHING_CONFIG.MAX_RESULTS && MATCHING_CONFIG.FALLBACKS.ignoreSpecialtiesIfShort) {
    scored = [];
    for (const c of baseCompanies) {
      const res = computeScore(c, request, { useSpecialties: false, useRegions: true });
      if (res) scored.push({ company: c, score: res.score });
    }
    scored.sort(sortFn);
  }

  // Fallback 2: zonder regio
  if (scored.length < MATCHING_CONFIG.MAX_RESULTS && MATCHING_CONFIG.FALLBACKS.ignoreRegionsIfShort) {
    scored = [];
    for (const c of baseCompanies) {
      const res = computeScore(c, request, { useSpecialties: false, useRegions: false });
      if (res) scored.push({ company: c, score: res.score });
    }
    scored.sort(sortFn);
  }

  return scored.slice(0, MATCHING_CONFIG.MAX_RESULTS);
}

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
      companies: matches.map(m => ({
        ...m.company,
        _matchScore: m.score,
      })),
    });
  } catch (err) {
    console.error("❌ publicRequests:", err);
    return res.status(500).json({ ok: false, message: "Interne fout." });
  }
});

module.exports = router;
