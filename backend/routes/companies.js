// backend/routes/companies.js

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Company = require("../models/company");

/**
 * Helper: slug genereren
 */
function makeSlug(name = "") {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * GET /api/companies
 * Publieke lijst voor results.html
 */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find({})
      .select("name city categories specialties slug")
      .sort({ name: 1 });

    res.json({
      ok: true,
      companies,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Kon bedrijven niet ophalen",
    });
  }
});

/**
 * GET /api/companies/slug/:slug
 * Publiek detail-endpoint voor company.html
 */
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const company = await Company.findOne({ slug });

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Bedrijf niet gevonden",
      });
    }

    res.json({
      ok: true,
      company,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Serverfout",
    });
  }
});

/**
 * GET /api/companies/me
 * Haal eigen bedrijf op
 */
router.get("/me", auth, async (req, res) => {
  try {
    const company = await Company.findOne({ owner: req.user.id });

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Geen bedrijf gekoppeld aan dit account",
      });
    }

    res.json({ ok: true, company });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Serverfout",
    });
  }
});

/**
 * PATCH /api/companies/me
 * Maak of update eigen bedrijf
 */
router.patch("/me", auth, async (req, res) => {
  try {
    const {
      name,
      city,
      description = "",
      categories = [],
      specialties = [],
    } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        ok: false,
        error: "Naam en plaats zijn verplicht",
      });
    }

    let company = await Company.findOne({ owner: req.user.id });

    if (!company) {
      company = new Company({
        owner: req.user.id,
        name,
        city,
        description,
        categories,
        specialties,
        slug: makeSlug(name),
      });
    } else {
      company.name = name;
      company.city = city;
      company.description = description;
      company.categories = categories;
      company.specialties = specialties;

      const newSlug = makeSlug(name);
      if (!company.slug || company.slug !== newSlug) {
        company.slug = newSlug;
      }
    }

    await company.save();

    res.json({
      ok: true,
      company,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Kon bedrijf niet opslaan",
    });
  }
});

module.exports = router;
