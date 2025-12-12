// backend/routes/companies.js
// v20251212-A1-FALLBACK
//
// Volledige companies-router voor Irisje.nl
// - CRUD voor bedrijven
// - Zoekfunctie met fallback naar omliggende plaatsen op Schouwen-Duiveland
// - Zoeken op slug
// - Endpoint om aanvragen naar geselecteerde bedrijven te koppelen
// 
// Deze file is ontworpen om direct te werken met server.js:
// app.use("/api/companies", require("./routes/companies"));
//

const express = require("express");
const router = express.Router();

const Company = require("../models/Company");
const Request = require("../models/Request");

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

/**
 * Normaliseert category/city zodat zoeken case-insensitive werkt.
 */
function buildCategoryFilter(category) {
  if (!category) return {};
  return { $regex: new RegExp(`^${category}$`, "i") };
}

function buildCityFilter(city) {
  if (!city) return {};
  return { $regex: new RegExp(city, "i") };
}

// -----------------------------------------------------------------------------
// 1) Basis-CRUD voor bedrijven
// -----------------------------------------------------------------------------

// POST /api/companies
router.post("/", async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    return res.json({ ok: true, item: company });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// GET /api/companies
router.get("/", async (req, res) => {
  try {
    const items = await Company.find().sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// LET OP: slug-route moet vóór :id-route gedefinieerd worden,
// anders wordt 'slug' behandeld als een id.

// GET /api/companies/slug/:slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    return res.json({ ok: true, item });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/companies/:id
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    return res.json({ ok: true, item });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// PUT /api/companies/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).lean();
    if (!updated) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    return res.json({ ok: true, item: updated });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// DELETE /api/companies/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2) Zoekfunctie met fallback (A1) – /api/companies/search
// -----------------------------------------------------------------------------
// Queryparameters:
//   - category: string (verplicht)
//   - city: string (verplicht)
// Retourneert:
//   {
//     ok: true,
//     results: [...],
//     fallbackUsed: boolean,
//     message: string | null
//   }
// -----------------------------------------------------------------------------

router.get("/search", async (req, res) => {
  try {
    const { category, city } = req.query;

    if (!category || !city) {
      return res.json({
        ok: true,
        results: [],
        fallbackUsed: false,
        message: null,
      });
    }

    // 1) Eerst zoeken in opgegeven plaats
    let results = await Company.find({
      category: buildCategoryFilter(category),
      city: buildCityFilter(city),
    }).lean();

    let fallbackUsed = false;
    let message = null;

    // 2) Als niets gevonden → fallback naar omliggende dorpen A1
    if (!results || results.length === 0) {
      results = await Company.find({
        category: buildCategoryFilter(category),
        city: { $in: FALLBACK_CITIES },
      }).lean();

      if (results && results.length > 0) {
        fallbackUsed = true;
        message = `Er zijn geen bedrijven in ${city}, maar wél in de buurt. Deze bedrijven op Schouwen-Duiveland passen bij je aanvraag.`;
      }
    }

    return res.json({
      ok: true,
      results: results || [],
      fallbackUsed,
      message,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3) Aanvraag koppelen aan geselecteerde bedrijven
//    POST /api/companies/send-requests
// -----------------------------------------------------------------------------
// Body:
//   - requestId: ObjectId van Request
//   - companyIds: [ObjectId, ...]
// -----------------------------------------------------------------------------

router.post("/send-requests", async (req, res) => {
  try {
    const { requestId, companyIds } = req.body;

    if (!requestId || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "requestId en companyIds zijn verplicht.",
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        ok: false,
        error: "Aanvraag niet gevonden.",
      });
    }

    // Koppel de aanvraag aan de geselecteerde bedrijven
    await Company.updateMany(
      { _id: { $in: companyIds } },
      { $addToSet: { receivedRequests: requestId } }
    );

    return res.json({
      ok: true,
      message: "Aanvragen succesvol gekoppeld aan bedrijven.",
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;