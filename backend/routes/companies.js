// backend/routes/companies.js
// v20251218-A3-STABLE

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const Request = require("../models/request");

// -----------------------------------------------------------------------------
// Fallback-plaatsen (Schouwen-Duiveland)
// -----------------------------------------------------------------------------
const FALLBACK_CITIES = [
  "Burgh-Haamstede",
  "Burghsluis",
  "Renesse",
  "Ellemeet",
  "Scharendijke",
  "Brouwershaven",
  "Zonnemaire",
  "Noordwelle",
  "Serooskerke",
  "Zierikzee",
  "Ouwerkerk",
  "Nieuwerkerk",
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactRegex(value) {
  return new RegExp(`^${escapeRegex(value)}$`, "i");
}

function looseRegex(value) {
  return new RegExp(escapeRegex(value), "i");
}

// -----------------------------------------------------------------------------
// CATEGORIEËN VOOR HOMEPAGE
// GET /api/companies/lists
// -----------------------------------------------------------------------------
router.get("/lists", async (req, res) => {
  try {
    const categories = await Company.distinct("categories");

    const cleaned = categories
      .flat()
      .filter(Boolean)
      .map((c) => c.trim())
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();

    res.json({ ok: true, categories: cleaned });
  } catch (err) {
    console.error("❌ companies/lists error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ZOEKEN + FALLBACK
// GET /api/companies/search
router.get("/search", async (req, res) => {
  try {
    const { category, specialty } = req.query;

    if (!category) {
      return res.json({ ok: true, results: [] });
    }

    const query = {
      categories: { $in: [new RegExp(category, "i")] },
      active: true,
    };

    if (specialty) {
      query.specialties = { $in: [new RegExp(specialty, "i")] };
    }

    const results = await Company.find(query)
      .limit(20)
      .select("_id name city rating premium")
      .lean();

    return res.json({
      ok: true,
      results,
      fallbackUsed: false,
      message: null,
    });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

    // 1️⃣ Primaire zoekopdracht
    let results = await Company.find(baseQuery).lean();

    let fallbackUsed = false;
    let message = null;

    // 2️⃣ Regionale fallback
    if (category && city && results.length === 0) {
      const fallbackCityRegexes = FALLBACK_CITIES.map(
        (c) => exactRegex(c)
      );

      results = await Company.find({
        categories: { $in: [categoryRegex] },
        city: { $in: fallbackCityRegexes },
      }).lean();

      if (results.length > 0) {
        fallbackUsed = true;
        message = `Geen bedrijven in ${city}, wel in de buurt.`;
      }
    }

    // 3️⃣ Landelijke fallback (ALTIJD laatste redmiddel)
    if (category && results.length === 0) {
      results = await Company.find({
        categories: { $in: [categoryRegex] },
      }).lean();

      if (results.length > 0) {
        fallbackUsed = true;
        message = `Geen bedrijven in ${city}, wel elders beschikbaar.`;
      }
    }

    res.json({
      ok: true,
      results,
      fallbackUsed,
      message,
    });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// SLUG
// -----------------------------------------------------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ID (LAATSTE)
// -----------------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// SEND REQUESTS
// -----------------------------------------------------------------------------
router.post("/send-requests", async (req, res) => {
  try {
    const { requestId, companyIds } = req.body;

    if (!requestId || !Array.isArray(companyIds) || !companyIds.length) {
      return res.status(400).json({ ok: false, error: "Ongeldige invoer." });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    await Company.updateMany(
      { _id: { $in: companyIds } },
      { $addToSet: { receivedRequests: requestId } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
