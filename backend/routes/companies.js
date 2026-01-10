// backend/routes/companies.js
// v20260110-SEARCH-FIX-CATEGORIES-ALIAS

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

// Categorie-aliases (gebruikerswoord → databasecategorie)
const CATEGORY_ALIASES = {
  advocaat: ["juridisch"],
  jurist: ["juridisch"],
};

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
// -----------------------------------------------------------------------------
router.get("/search", async (req, res) => {
  try {
    const { category, specialty } = req.query;

    if (!category && !specialty) {
      return res.json({
        ok: true,
        results: [],
        fallbackUsed: false,
        message: null,
      });
    }

    const query = {
      active: true,
    };

    if (category) {
      const key = String(category).toLowerCase();
      const values = CATEGORY_ALIASES[key] || [category];

      query.categories = {
        $elemMatch: {
          $regex: values.map((v) => escapeRegex(v)).join("|"),
          $options: "i",
        },
      };
    }

    if (specialty) {
      query.specialties = {
        $elemMatch: {
          $regex: escapeRegex(specialty),
          $options: "i",
        },
      };
    }

    const results = await Company.find(query)
      .limit(20)
      .select(
        "_id name city avgRating reviewCount isVerified categories specialties"
      )
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
    if (!item)
      return res.status(404).json({
        ok: false,
        error: "Company niet gevonden.",
      });
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
      return res
        .status(400)
        .json({ ok: false, error: "Onvolledige invoer." });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const exists = await Company.findOne({ slug });
    if (exists)
      return res
        .status(400)
        .json({ ok: false, error: "Bedrijf bestaat al." });

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
      return res
        .status(400)
        .json({ ok: false, error: "Ongeldig company-id." });
    }

    const item = await Company.findById(id).lean();
    if (!item)
      return res
        .status(404)
        .json({ ok: false, error: "Company niet gevonden." });

    if (String(item.owner) !== String(req.user.id)) {
      return res.status(403).json({ ok: false, error: "Geen toegang." });
    }

    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMPANY BIJWERKEN
// PUT /api/companies/:id
// -----------------------------------------------------------------------------
router.put("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ ok: false, error: "Ongeldig company-id." });
    }

    const company = await Company.findById(id);
    if (!company)
      return res
        .status(404)
        .json({ ok: false, error: "Company niet gevonden." });

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
