// backend/routes/companies.js
// v20251212-A1-FINAL

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
// Helpers (GEEN $regex objecten!)
// -----------------------------------------------------------------------------
function buildExactRegex(value) {
  return new RegExp(`^${value}$`, "i");
}

// -----------------------------------------------------------------------------
// CRUD
// -----------------------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.json({ ok: true, item: company });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const items = await Company.find().sort({ createdAt: -1 }).lean();
    res.json({ ok: true, items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ZOEKEN + FALLBACK (MOET BOVEN :id)
// -----------------------------------------------------------------------------
router.get("/search", async (req, res) => {
  try {
    const { category, city, q } = req.query;

    let query = {};

    if (category) {
      query.category = buildExactRegex(category);
    }

    if (q) {
      query.name = new RegExp(q, "i");
    }

    if (city) {
      query.city = buildExactRegex(city);
    }

    let results = await Company.find(query).lean();

    let fallbackUsed = false;
    let message = null;

    if (city && category && results.length === 0) {
      results = await Company.find({
        category: buildExactRegex(category),
        city: { $in: FALLBACK_CITIES },
      }).lean();

      if (results.length > 0) {
        fallbackUsed = true;
        message = `Geen bedrijven in ${city}, wel in de buurt.`;
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
