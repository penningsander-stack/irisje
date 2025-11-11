// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");
const authMiddleware = require("../middleware/auth"); // 👈 geen destructuring

/* ============================================================
   🔹 Vaste lijst met toegestane specialismen
   (kan later eenvoudig worden aangepast)
============================================================ */
const ALLOWED_SPECIALTIES = [
  "Arbeidsrecht",
  "Strafrecht",
  "Familierecht",
  "Huurrecht",
  "Ondernemingsrecht",
  "Bestuursrecht",
  "Letselschade",
  "Contractenrecht",
  "Vastgoedrecht",
  "Sociaal zekerheidsrecht",
  "Overig",
];

/* ============================================================
   ✅ Alle bedrijven ophalen (openbaar)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json({ ok: true, total: companies.length, items: companies });
  } catch (error) {
    console.error("❌ Fout bij ophalen bedrijven:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen bedrijven" });
  }
});

/* ============================================================
   🔍 Zoeken op categorie, stad en specialisme
============================================================ */
router.get("/search", async (req, res) => {
  try {
    const { category = "", city = "", specialty = "" } = req.query;

    const filters = {};

    if (category) {
      filters.categories = { $regex: new RegExp(category, "i") };
    }

    if (city) {
      filters.city = { $regex: new RegExp(city, "i") };
    }

    if (specialty) {
      // zoeken in veld specialties
      filters.specialties = { $regex: new RegExp(specialty, "i") };
    }

    const companies = await Company.find(filters)
      .sort({ avgRating: -1, reviewCount: -1 })
      .lean();

    res.json({ ok: true, items: companies });
  } catch (error) {
    console.error("❌ Fout bij zoeken bedrijven:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij zoeken bedrijven" });
  }
});

/* ============================================================
   ✅ Bedrijf ophalen via slug
============================================================ */
router.get("/slug/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug }).lean();
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }
    // zorg dat frontend altijd een array heeft
    if (!Array.isArray(company.specialties)) {
      company.specialties = [];
    }
    res.json(company);
  } catch (error) {
    console.error("❌ Fout bij ophalen bedrijf via slug:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen bedrijf" });
  }
});

/* ============================================================
   🧩 Nieuw bedrijf aanmaken (alleen ingelogde gebruiker)
============================================================ */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      tagline = "",
      description = "",
      categories = [],
      specialties = [],
      city = "",
      phone = "",
      email = "",
      website = "",
    } = req.body || {};

    if (!name || !slug) {
      return res.status(400).json({ ok: false, error: "Naam en slug zijn verplicht" });
    }

    // ✅ alleen toegestane specialismen opslaan
    const validSpecialties = (Array.isArray(specialties) ? specialties : [])
      .filter((s) => ALLOWED_SPECIALTIES.includes(s));

    const company = new Company({
      name,
      slug,
      tagline,
      description,
      categories: Array.isArray(categories) ? categories : [],
      specialties: validSpecialties,
      city,
      phone,
      email,
      website,
      owner: req.user.id,
    });

    await company.save();
    res.json({ ok: true, company });
  } catch (error) {
    console.error("❌ Fout bij aanmaken bedrijf:", error);

    // duplicate key (bijv. slug bestaat al)
    if (error.code === 11000) {
      return res.status(400).json({ ok: false, error: "Slug bestaat al, kies een andere." });
    }

    res.status(500).json({ ok: false, error: "Serverfout bij aanmaken bedrijf" });
  }
});

/* ============================================================
   ✏️ Bedrijf bijwerken (alleen eigenaar)
============================================================ */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "Geen toegang" });
    }

    const updates = { ...req.body };

    // ✅ specialties filteren op toegestane lijst
    if (Array.isArray(updates.specialties)) {
      updates.specialties = updates.specialties.filter((s) => ALLOWED_SPECIALTIES.includes(s));
    }

    Object.assign(company, updates);
    await company.save();

    res.json({ ok: true, company });
  } catch (error) {
    console.error("❌ Fout bij bijwerken bedrijf:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij bijwerken bedrijf" });
  }
});

/* ============================================================
   🗑️ Bedrijf verwijderen (alleen eigenaar)
============================================================ */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });
    }

    if (company.owner.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, error: "Geen toegang" });
    }

    await company.deleteOne();
    res.json({ ok: true, message: "Bedrijf verwijderd" });
  } catch (error) {
    console.error("❌ Fout bij verwijderen bedrijf:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij verwijderen bedrijf" });
  }
});

/* ============================================================
   📋 Endpoint om toegestane specialismen op te halen
============================================================ */
router.get("/specialties/list", (req, res) => {
  res.json({ ok: true, specialties: ALLOWED_SPECIALTIES });
});

module.exports = router;
