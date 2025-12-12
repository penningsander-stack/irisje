// backend/routes/companies.js
// v20251209-FINAL-FIX
//
// Herstelt alle serverfouten:
// - correcte case (company.js)
// - automatische categorieën uit DB
// - compatibel met index.js / results.js / company.js
// - uniforme JSON-output
// - veilig en schaalbaar

const express = require("express");
const router = express.Router();

const Company = require("../models/company");   // LET OP: kleine letters, matcht jouw repo
const auth = require("../middleware/auth");

/* ============================================================
   Helper functies
============================================================ */

function ensure_array(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string")
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeMultiFields(doc) {
  if (!doc) return doc;
  const out = { ...doc };
  const multi = [
    "specialties",
    "regions",
    "certifications",
    "recognitions",
    "memberships",
    "languages",
    "services",
    "tags",
    "categories",
  ];
  multi.forEach((f) => {
    if (!Array.isArray(out[f])) out[f] = [];
  });
  return out;
}

/* ============================================================
   1. AUTOMATISCHE CATEGORIEËN
   /api/companies/lists
============================================================ */
router.get("/lists", async (req, res) => {
  try {
    // Haal alle unieke categorieën uit de database
    let categories = await Company.distinct("categories");

    // Sorteer alfabetisch voor nette weergave
    categories = categories
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "nl"));

    return res.json({
      ok: true,
      categories,
      total: categories.length,
    });

  } catch (err) {
    console.error("❌ Fout in /companies/lists:", err);
    return res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   2. ADMIN — overzicht van ALLE bedrijven
   /api/companies/all
============================================================ */
router.get("/all", async (req, res) => {
  try {
    let companies = await Company.find({})
      .populate("owner", "email")
      .lean();

    companies = companies.map((c) => ({
      _id: c._id,
      name: c.name || "(naam onbekend)",
      slug: c.slug || "",
      email: c.email || c.owner?.email || "-",
      isVerified: !!c.isVerified,
      reviewCount: c.reviewCount || 0,
    }));

    return res.json(companies);

  } catch (err) {
    console.error("❌ /companies/all fout:", err);
    return res.status(500).json({ ok: false });
  }
});

/* ============================================================
   3. ZOEKFUNCTIE
   /api/companies/search
   Voor index.js én results.js
============================================================ */
router.get("/search", async (req, res) => {
  try {
    const { q = "", category = "", city = "" } = req.query;

    const filters = {};

    // Zoeken op zoekterm of categorie
    const searchTerm = q || category;
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      filters.$or = [
        { specialties: regex },
        { services: regex },
        { tags: regex },
        { categories: regex },
        { name: regex },
        { tagline: regex },
        { description: regex },
      ];
    }

    // Zoeken op plaats
    if (city) filters.city = new RegExp(city, "i");

    let items = await Company.find(filters)
      .sort({ avgRating: -1, reviewCount: -1 })
      .lean();

    items = items.map((c) => normalizeMultiFields(c));

    return res.json({ ok: true, items });

  } catch (err) {
    console.error("❌ fout bij zoeken:", err);
    return res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   4. DETAILS PER SLUG
   /api/companies/slug/:slug
============================================================ */
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();

    if (!item)
      return res.status(404).json({ ok: false, error: "not found" });

    return res.json(normalizeMultiFields(item));

  } catch (err) {
    console.error("❌ slug fout:", err);
    return res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   5. ALLE BEDRIJVEN (public)
   /api/companies/
============================================================ */
router.get("/", async (req, res) => {
  try {
    let items = await Company.find({}).lean();
    items = items.map((c) => normalizeMultiFields(c));

    return res.json({
      ok: true,
      total: items.length,
      items,
    });

  } catch (err) {
    console.error("❌ fout /companies:", err);
    return res.status(500).json({ ok: false });
  }
});

/* ============================================================
   6. OP ID — admin/tools
   /api/companies/:id
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();

    if (!item)
      return res.status(404).json({ ok: false, error: "not found" });

    return res.json(normalizeMultiFields(item));

  } catch (err) {
    console.error("❌ ID fout:", err);
    return res.status(500).json({ ok: false });
  }
});


/* ============================================================
   7. AANVRAAG VERSTUREN NAAR GEKOZEN BEDRIJVEN
   ------------------------------------------------------------
   POST /api/companies/send-requests
   Body: { requestId, companyIds: [..] }
   - Geeft de basis-aanvraag terug
   - Geeft de lijst bedrijven terug waarheen verzonden is
   - (Later uit te breiden met e-mail / logging)
============================================================ */
const Request = require("../models/request");

router.post("/send-requests", async (req, res) => {
  try {
    const { requestId, companyIds } = req.body || {};

    if (!requestId || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "requestId en minstens één bedrijf zijn verplicht." });
    }

    const request = await Request.findById(requestId).lean();
    if (!request) {
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden." });
    }

    const companies = await Company.find({ _id: { $in: companyIds } })
      .lean();

    if (!companies.length) {
      return res
        .status(404)
        .json({ ok: false, error: "Geen bedrijven gevonden voor de opgegeven IDs." });
    }

    // Basis-info voor de frontend (thank-you pagina).
    const cleanRequest = {
      id: String(request._id),
      name: request.name || "",
      email: request.email || "",
      city: request.city || "",
      category: request.category || "",
      message: request.message || "",
    };

    const sentTo = companies.map((c) => ({
      id: String(c._id),
      name: c.name || "(naam onbekend)",
      city: c.city || "",
      slug: c.slug || "",
      email: c.email || "",
      reviewCount: c.reviewCount || 0,
      rating: c.rating || null,
    }));

    // TODO: hier later e-mails / logging / dupliceren per bedrijf toevoegen.

    return res.json({
      ok: true,
      request: cleanRequest,
      sentTo,
    });
  } catch (err) {
    console.error("❌ Fout in /companies/send-requests:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij versturen aanvragen." });
  }
});


module.exports = router;

