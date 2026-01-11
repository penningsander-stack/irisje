// backend/routes/admin.js
// v20260111-SECTORS-SPECIALTIES-ENFORCED

const express = require("express");
const router = express.Router();

const { authMiddleware, requireAdmin } = require("../middleware/auth");

const Company = require("../models/company");
const Review = require("../models/review");
const Claim = require("../models/claim");
const { getLogs } = require("../utils/logger");

// ============================================================
// VASTE SECTOREN & SPECIALISMEN
// ============================================================
const SECTORS = {
  juridisch: [
    "arbeidsrecht",
    "familierecht",
    "bestuursrecht",
    "huurrecht",
    "ondernemingsrecht",
  ],
  bouw: [
    "aannemer",
    "installatie",
    "elektra",
    "loodgieter",
  ],
  zorg: [
    "thuiszorg",
    "jeugdzorg",
    "ggz",
  ],
};

// helpers
function makeSlug(value) {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function validateSectorsAndSpecialties(sectors = [], specialties = []) {
  // sectors = categories (technisch)
  for (const sector of sectors) {
    if (!SECTORS[sector]) {
      return `Ongeldige sector: ${sector}`;
    }
  }

  for (const spec of specialties) {
    const found = sectors.some((sector) =>
      SECTORS[sector].includes(spec)
    );
    if (!found) {
      return `Ongeldig specialisme: ${spec}`;
    }
  }

  return null;
}

// ============================================================
// ADMIN AUTH
// ============================================================
router.use(authMiddleware, requireAdmin);

// ============================================================
// GET companies
// ============================================================
router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ ok: true, companies });
  } catch {
    return res.status(500).json({ ok: false, error: "Kon bedrijven niet ophalen" });
  }
});

// ============================================================
// POST company (admin toevoegen)
// ============================================================
router.post("/companies", async (req, res) => {
  try {
    const {
      name,
      city,
      description,
      categories = [],
      specialties = [],
      isVerified,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "Naam is verplicht" });
    }

    const validationError = validateSectorsAndSpecialties(categories, specialties);
    if (validationError) {
      return res.status(400).json({ ok: false, error: validationError });
    }

    const company = await Company.create({
      name: name.trim(),
      slug: makeSlug(name),
      owner: req.user.id,
      city: typeof city === "string" ? city.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
      categories,
      specialties,
      isVerified: typeof isVerified === "boolean" ? isVerified : false,
    });

    return res.status(201).json({ ok: true, company });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon bedrijf niet aanmaken",
      details: err.message,
    });
  }
});

// ============================================================
// PATCH company
// ============================================================
router.patch("/companies/:id", async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
      updates.slug = makeSlug(req.body.name);
    }

    if (typeof req.body.city === "string") updates.city = req.body.city.trim();
    if (typeof req.body.description === "string") updates.description = req.body.description.trim();

    if (Array.isArray(req.body.categories)) {
      const err = validateSectorsAndSpecialties(
        req.body.categories,
        req.body.specialties || []
      );
      if (err) return res.status(400).json({ ok: false, error: err });
      updates.categories = req.body.categories;
    }

    if (Array.isArray(req.body.specialties)) {
      updates.specialties = req.body.specialties;
    }

    if (typeof req.body.isVerified === "boolean") updates.isVerified = req.body.isVerified;

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    return res.json({ ok: true, company });
  } catch {
    return res.status(500).json({ ok: false, error: "Kon bedrijf niet bijwerken" });
  }
});

// ============================================================
// DELETE company
// ============================================================
router.delete("/companies/:id", async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false, error: "Kon bedrijf niet verwijderen" });
  }
});

module.exports = router;
