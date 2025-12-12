// backend/routes/companies.js
// v20251212-FALLBACK-A1
//
// Volledige companies-router met:
// - Zoekfunctie met fallback naar omliggende plaatsen (A1)
// - CRUD (create, read, update, delete)
// - Slug-lookup
// - Aanvraag-verzend endpoint
//

const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Request = require("../models/Request");

// --- Fallback A1 dorpen op Schouwen-Duiveland ---
const FALLBACK_CITIES = [
  "Burgh-Haamstede","Burghsluis","Renesse","Ellemeet","Scharendijke",
  "Brouwershaven","Zonnemaire","Noordwelle","Serooskerke",
  "Zierikzee","Ouwerkerk","Nieuwerkerk"
];

// ------------------------------
// 1. POST /api/companies
// ------------------------------
router.post("/", async (req, res) => {
  try {
    const c = new Company(req.body);
    await c.save();
    res.json({ ok: true, item: c });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ------------------------------
// 2. GET /api/companies
// ------------------------------
router.get("/", async (req, res) => {
  const items = await Company.find().sort({ createdAt: -1 }).lean();
  res.json({ ok: true, items });
});

// ------------------------------
// 3. GET /api/companies/:id
// ------------------------------
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false });
    res.json({ ok: true, item });
  } catch {
    res.status(400).json({ ok: false });
  }
});

// ------------------------------
// 4. PUT /api/companies/:id
// ------------------------------
router.put("/:id", async (req, res) => {
  try {
    const item = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ------------------------------
// 5. DELETE /api/companies/:id
// ------------------------------
router.delete("/:id", async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ ok: false });
  }
});

// ------------------------------
// 6. GET /api/companies/slug/:slug
// ------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) return res.status(404).json({ ok: false });
    res.json({ ok: true, item });
  } catch {
    res.status(400).json({ ok: false });
  }
});

// ------------------------------
// 7. Zoekfunctie met fallback A1
// GET /api/companies/search?category=...&city=...
// ------------------------------
router.get("/search", async (req, res) => {
  try {
    const { category, city } = req.query;
    if (!category || !city) {
      return res.json({ ok: true, results: [], fallbackUsed: false });
    }

    // 1. Eerst zoeken in exacte stad
    let results = await Company.find({
      category: { $regex: new RegExp(`^${category}$`, "i") },
      city: { $regex: new RegExp(city, "i") },
    }).lean();

    let fallbackUsed = false;
    let message = null;

    // 2. Als niets gevonden -> fallback A1
    if (!results.length) {
      results = await Company.find({
        category: { $regex: new RegExp(`^${category}$`, "i") },
        city: { $in: FALLBACK_CITIES },
      }).lean();

      if (results.length) {
        fallbackUsed = true;
        message = `Er zijn geen bedrijven in ${city}, maar wél in de buurt. Deze bedrijven op Schouwen-Duiveland passen bij je aanvraag.`;
      }
    }

    res.json({
      ok: true,
      results,
      fallbackUsed,
      message,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------
// 8. Verstuur aanvragen naar geselecteerde bedrijven
// POST /api/companies/send-requests
// ------------------------------
router.post("/send-requests", async (req, res) => {
  try {
    const { requestId, companyIds } = req.body;
    if (!requestId || !companyIds?.length) {
      return res.status(400).json({ ok: false, error: "Ontbrekende velden." });
    }

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });

    // update: bedrijven ontvangen deze aanvraag
    await Company.updateMany(
      { _id: { $in: companyIds } },
      { $push: { receivedRequests: requestId } }
    );

    res.json({ ok: true, message: "Aanvragen succesvol verstuurd." });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
