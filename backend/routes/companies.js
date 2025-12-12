// backend/routes/companies.js
// v20251212-A1-FALLBACK-FIXED

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const Request = require("../models/request");

// -----------------------------------------------------------------------------
// Fallback-plaatsen op Schouwen-Duiveland (A1)
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
function buildCategoryFilter(category) {
  if (!category) return {};
  return { $regex: new RegExp(`^${category}$`, "i") };
}

function buildCityFilter(city) {
  if (!city) return {};
  return { $regex: new RegExp(city, "i") };
}

// -----------------------------------------------------------------------------
// 1) Basis-CRUD
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
// 2) ZOEKEN (MOET BOVEN :id STAAN)
// -----------------------------------------------------------------------------

router.get("/search", async (req, res) => {
  try {
    const { category, city } = req.query;

    router.get("/search", async (req, res) => {
  try {
    const { category, city, q } = req.query;

    let query = {};

    if (category) {
      query.category = buildCategoryFilter(category);
    }

    if (q) {
      query.name = { $regex: q, $options: "i" };
    }

    if (city) {
      query.city = buildCityFilter(city);
    }

    let results = await Company.find(query).lean();

    let fallbackUsed = false;
    let message = null;

    // Alleen fallback gebruiken ALS city is opgegeven
    if (city && results.length === 0 && category) {
      results = await Company.find({
        category: buildCategoryFilter(category),
        city: { $in: FALLBACK_CITIES },
      }).lean();

      if (results.length > 0) {
        fallbackUsed = true;
        message = `Geen bedrijven in ${city}, wel in de buurt.`;
      }
    }

    return res.json({
      ok: true,
      results,
      fallbackUsed,
      message,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});


    let results = await Company.find({
      category: buildCategoryFilter(category),
      city: buildCityFilter(city),
    }).lean();

    let fallbackUsed = false;
    let message = null;

    if (!results.length) {
      results = await Company.find({
        category: buildCategoryFilter(category),
        city: { $in: FALLBACK_CITIES },
      }).lean();

      if (results.length) {
        fallbackUsed = true;
        message = `Er zijn geen bedrijven in ${city}, maar wel in de buurt.`;
      }
    }

    res.json({ ok: true, results, fallbackUsed, message });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3) SLUG
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
// 4) ID (ALTIJD ALS LAATSTE)
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

router.put("/:id", async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    res.json({ ok: true, item: updated });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 5) SEND REQUESTS
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
