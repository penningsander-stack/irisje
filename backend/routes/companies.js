// backend/routes/companies.js
const express = require("express");
const router = express.Router();

const Company = require("../models/company"); // ← correct
const auth = require("../middleware/auth");

/* ============================================================
   Helpers
============================================================ */
function ensure_array(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string")
    return v.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function normalizeMultiFields(doc) {
  const out = { ...doc };
  const fields = [
    "specialties",
    "regions",
    "certifications",
    "recognitions",
    "memberships",
    "languages",
    "services",
    "tags",
    "categories"
  ];
  fields.forEach(f => {
    if (!Array.isArray(out[f])) out[f] = [];
  });
  return out;
}

/* ============================================================
   1. /api/companies/lists
============================================================ */
router.get("/lists", (req, res) => {
  res.json({
    ok: true,
    specialties: [],
    certifications: [],
    languages: []
  });
});

/* ============================================================
   2. ADMIN – /api/companies/all
============================================================ */
router.get("/all", async (req, res) => {
  try {
    let companies = await Company.find({})
      .populate("owner", "email")
      .lean();

    companies = companies.map(c => ({
      _id: c._id,
      name: c.name || "(naam onbekend)",
      slug: c.slug || "",
      email: c.email || c.owner?.email || "-",
      isVerified: !!c.isVerified,
      reviewCount: c.reviewCount || 0
    }));

    res.json(companies);
  } catch (err) {
    console.error("❌ /companies/all fout:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   3. ZOEKEN – /api/companies/search
   FIXED → zoekt nu in specialties, services, tags, categories, city
============================================================ */
router.get("/search", async (req, res) => {
  try {
    const { category = "", city = "" } = req.query;

    const filters = {};

    if (category) {
      const regex = new RegExp(category, "i");
      filters.$or = [
        { specialties: regex },
        { services: regex },
        { tags: regex },
        { categories: regex }
      ];
    }

    if (city) {
      filters.city = { $regex: new RegExp(city, "i") };
    }

    let items = await Company.find(filters)
      .sort({ avgRating: -1, reviewCount: -1 })
      .lean();

    items = items.map(c => normalizeMultiFields(c));

    res.json({ ok: true, items });
  } catch (err) {
    console.error("❌ fout bij zoeken:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   4. GET BY SLUG – /api/companies/slug/:slug
============================================================ */
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) return res.status(404).json({ ok: false, error: "not found" });

    res.json(normalizeMultiFields(item));
  } catch (err) {
    console.error("❌ slug fout:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   5. PUBLIC INDEX – /api/companies/
============================================================ */
router.get("/", async (req, res) => {
  try {
    let items = await Company.find({}).lean();
    items = items.map(c => normalizeMultiFields(c));
    res.json({ ok: true, total: items.length, items });
  } catch (err) {
    console.error("❌ fout bij ophalen bedrijven:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

/* ============================================================
   6. GET /api/companies/:id
============================================================ */
router.get("/:id", async (req, res) => {
  try {
    const item = await Company.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, error: "not found" });

    res.json(normalizeMultiFields(item));
  } catch (err) {
    console.error("❌ ID fout:", err);
    res.status(500).json({ ok: false, error: "serverfout" });
  }
});

module.exports = router;
