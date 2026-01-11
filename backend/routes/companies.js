// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");
const auth = require("../middleware/auth");

/**
 * GET /api/companies/search
 * Publieke zoekroute
 */
router.get("/search", async (req, res) => {
  try {
    const { category, city, q } = req.query;

    const filter = {};

    if (category) {
      filter.categories = category;
    }

    if (city) {
      filter.city = new RegExp(`^${city}$`, "i");
    }

    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
      ];
    }

    const companies = await Company.find(filter).lean();
    res.json({ ok: true, companies });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Zoeken mislukt" });
  }
});

/**
 * GET /api/companies
 * Publiek overzicht
 */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json({ ok: true, companies });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Kon bedrijven niet ophalen" });
  }
});

/**
 * GET /api/companies/:id
 * Publiek detail
 */
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }
    res.json({ ok: true, company });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Kon bedrijf niet ophalen" });
  }
});

/**
 * PATCH /api/companies/me
 * Update eigen bedrijf (voor register-company)
 */
router.patch("/me", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let company = await Company.findOne({ owner: req.user.id });

if (!company) {
  company = new Company({
    owner: req.user.id,
    name: req.body.name,
    city: req.body.city,
    description: req.body.description || "",
    categories: req.body.categories || [],
    specialties: req.body.specialties || [],
    slug: req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
  });
} else {
  company.name = req.body.name;
  company.city = req.body.city;
  company.description = req.body.description || "";
  company.categories = req.body.categories || [];
  company.specialties = req.body.specialties || [];
}

await company.save();

res.json({ ok: true, company });


    const {
      name,
      city,
      description,
      categories,
      specialties,
    } = req.body;

    if (name !== undefined) company.name = name;
    if (city !== undefined) company.city = city;
    if (description !== undefined) company.description = description;
    if (Array.isArray(categories)) company.categories = categories;
    if (Array.isArray(specialties)) company.specialties = specialties;

    await company.save();

    res.json({ ok: true, company });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Bijwerken mislukt",
      details: err.message,
    });
  }
});

module.exports = router;
