// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");
const authMiddleware = require("../middleware/auth");

/* ============================================================
   🔹 Toegestane waarden (kan later worden uitgebreid)
============================================================ */
const ALLOWED_SPECIALTIES = [
  "Arbeidsrecht", "Strafrecht", "Familierecht", "Huurrecht",
  "Ondernemingsrecht", "Bestuursrecht", "Letselschade",
  "Contractenrecht", "Vastgoedrecht", "Sociaal zekerheidsrecht", "Overig",
];

const ALLOWED_CERTIFICATIONS = [
  "VCA", "ISO 9001", "Erkend Installateur", "BOVAG", "Techniek Nederland",
];

const ALLOWED_LANGUAGES = [
  "Nederlands", "Engels", "Duits", "Frans", "Pools", "Turks", "Arabisch",
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
   🔍 Uitgebreid zoeken op categorie, stad, regio, specialisme, certificering
============================================================ */
router.get("/search", async (req, res) => {
  try {
    const { category = "", city = "", region = "", specialty = "", certification = "" } = req.query;
    const filters = {};

    if (category) filters.categories = { $regex: new RegExp(category, "i") };
    if (city) filters.city = { $regex: new RegExp(city, "i") };
    if (region) filters.regions = { $regex: new RegExp(region, "i") };
    if (specialty) filters.specialties = { $regex: new RegExp(specialty, "i") };
    if (certification) filters.certifications = { $regex: new RegExp(certification, "i") };

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

    // Zorg dat frontend arrays ontvangt
    ["specialties", "regions", "certifications", "languages"].forEach((f) => {
      if (!Array.isArray(company[f])) company[f] = [];
    });

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
      regions = [],
      worksNationwide = false,
      certifications = [],
      recognitions = [],
      memberships = [],
      languages = [],
      availability = "",
      city = "",
      phone = "",
      email = "",
      website = "",
    } = req.body || {};

    if (!name || !slug) {
      return res.status(400).json({ ok: false, error: "Naam en slug zijn verplicht" });
    }

    const validSpecialties = (Array.isArray(specialties) ? specialties : [])
      .filter((s) => ALLOWED_SPECIALTIES.includes(s));
    const validCertifications = (Array.isArray(certifications) ? certifications : [])
      .filter((c) => ALLOWED_CERTIFICATIONS.includes(c));
    const validLanguages = (Array.isArray(languages) ? languages : [])
      .filter((l) => ALLOWED_LANGUAGES.includes(l));

    const company = new Company({
      name,
      slug,
      tagline,
      description,
      categories: Array.isArray(categories) ? categories : [],
      specialties: validSpecialties,
      regions: Array.isArray(regions) ? regions : [],
      worksNationwide: !!worksNationwide,
      certifications: validCertifications,
      recognitions: Array.isArray(recognitions) ? recognitions : [],
      memberships: Array.isArray(memberships) ? memberships : [],
      languages: validLanguages,
      availability,
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

    // ✅ filter arrays op toegestane waarden
    if (Array.isArray(updates.specialties)) {
      updates.specialties = updates.specialties.filter((s) => ALLOWED_SPECIALTIES.includes(s));
    }
    if (Array.isArray(updates.certifications)) {
      updates.certifications = updates.certifications.filter((c) =>
        ALLOWED_CERTIFICATIONS.includes(c)
      );
    }
    if (Array.isArray(updates.languages)) {
      updates.languages = updates.languages.filter((l) => ALLOWED_LANGUAGES.includes(l));
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
   📋 Endpoint voor toegestane waarden
============================================================ */
router.get("/lists", (req, res) => {
  res.json({
    ok: true,
    specialties: ALLOWED_SPECIALTIES,
    certifications: ALLOWED_CERTIFICATIONS,
    languages: ALLOWED_LANGUAGES,
  });
});

module.exports = router;
