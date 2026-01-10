// backend/routes/companies.js
// v20260110-SEARCH-ROBUST-CATEGORIES-REGEX

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Company = require("../models/company");
const auth = require("../middleware/auth");

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toNonEmptyString(value) {
  if (typeof value !== "string") return "";
  const v = value.trim();
  return v.length ? v : "";
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
      .map((c) => String(c).trim())
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();

    res.json({ ok: true, categories: cleaned });
  } catch (err) {
    console.error("❌ companies/lists error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// MIJN BEDRIJVEN
// GET /api/companies/my
// -----------------------------------------------------------------------------
router.get("/my", auth, async (req, res) => {
  try {
    const companies = await Company.find({ owner: req.user.id })
      .select("_id name city")
      .lean();
    res.json({ ok: true, companies });
  } catch (err) {
    console.error("❌ companies/my error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ZOEKEN
// GET /api/companies/search
//
// Ondersteunt:
// - ?category=...        (string)
// - ?categories=...      (alias van category)
// - ?specialty=...       (string)
// - ?q=...               (optioneel: zoekt in name/city)
// - ?limit=...           (optioneel)
//
// Belangrijk: categories/specialties zijn array-velden. Regex matchen we via $elemMatch.
// -----------------------------------------------------------------------------
router.get("/search", async (req, res) => {
  try {
    // Accept both "category" and "categories" as input (frontend kan beide gebruiken)
    const categoryRaw =
      toNonEmptyString(req.query.category) || toNonEmptyString(req.query.categories);
    const specialtyRaw = toNonEmptyString(req.query.specialty);
    const qRaw = toNonEmptyString(req.query.q);

    // Als er echt niets is om op te zoeken, geef lege set terug
    if (!categoryRaw && !specialtyRaw && !qRaw) {
      return res.json({ ok: true, results: [], fallbackUsed: false, message: null });
    }

    // Bouw query op
    const query = {};

    // Active filter: laat 'm staan, maar maak 'm tolerant:
    // - active:true is gewenst
    // - maar als 'active' ontbreekt in oudere/seed data, willen we die niet per ongeluk wegfilteren
    //   Daarom: active != false
    query.active = { $ne: false };

    if (categoryRaw) {
      const rx = new RegExp(escapeRegex(categoryRaw), "i");
      query.categories = { $elemMatch: rx };
    }

    if (specialtyRaw) {
      const rx = new RegExp(escapeRegex(specialtyRaw), "i");
      query.specialties = { $elemMatch: rx };
    }

    if (qRaw) {
      const rx = new RegExp(escapeRegex(qRaw), "i");
      query.$or = [{ name: rx }, { city: rx }];
    }

    const limit = Math.max(
      1,
      Math.min(50, Number.parseInt(req.query.limit, 10) || 20)
    );

    const results = await Company.find(query)
      .limit(limit)
      .select("_id name city avgRating reviewCount isVerified categories specialties slug")
      .lean();

    res.json({ ok: true, results, fallbackUsed: false, message: null });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMPANY VIA SLUG (publiek)
// GET /api/companies/slug/:slug
// -----------------------------------------------------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) return res.status(404).json({ ok: false, error: "Company niet gevonden." });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// BEDRIJF REGISTREREN
// POST /api/companies
// -----------------------------------------------------------------------------
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, city, categories = [], specialties = [] } = req.body;

    if (!name || !city || !categories.length) {
      return res.status(400).json({ ok: false, error: "Onvolledige invoer." });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const exists = await Company.findOne({ slug });
    if (exists) return res.status(400).json({ ok: false, error: "Bedrijf bestaat al." });

    const company = await Company.create({
      name,
      slug,
      city,
      categories,
      specialties,
      owner: userId,
      active: true,
    });

    res.json({ ok: true, companyId: company._id });
  } catch (err) {
    console.error("❌ companies POST error:", err);
    res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

// -----------------------------------------------------------------------------
// COMPANY VIA ID (dashboard ophalen)
// GET /api/companies/:id
// -----------------------------------------------------------------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "Ongeldig company-id." });
    }

    const item = await Company.findById(id).lean();
    if (!item) return res.status(404).json({ ok: false, error: "Company niet gevonden." });

    if (String(item.owner) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, error: "Geen toegang." });
    }

    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMPANY BIJWERKEN (dashboard opslaan)
// PUT /api/companies/:id
// -----------------------------------------------------------------------------
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "Ongeldig company-id." });
    }

    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ ok: false, error: "Company niet gevonden." });

    if (String(company.owner) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, error: "Geen toegang." });
    }

    const allowed = [
      "city",
      "regions",
      "specialties",
      "workforms",
      "targetGroups",
      "certifications",
      "languages",
      "memberships",
      "availability",
      "worksNationwide",
      "introduction",
      "reasons",
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ companies PUT error:", err);
    res.status(500).json({ ok: false, error: "Serverfout." });
  }
});

module.exports = router;
