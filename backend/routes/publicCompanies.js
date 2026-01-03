// backend/routes/publicCompanies.js
// v20260103-PUBLIC-COMPANIES-SYSTEM-OWNER

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const { getSystemUser } = require("../utils/systemUser");

/**
 * POST /api/publicCompanies
 * Publieke aanmelding van bedrijf (zonder login)
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      categories,
      specialties,
      city,
      description
    } = req.body;

    if (
      !name ||
      !Array.isArray(categories) ||
      categories.length === 0 ||
      !city ||
      !description
    ) {
      return res.status(400).json({
        ok: false,
        error: "Ontbrekende verplichte velden"
      });
    }

    // 👇 haal (of maak) system user
    const systemUser = await getSystemUser();

    const company = await Company.create({
      name: String(name).trim(),
      categories: categories.map(String),
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      city: String(city).trim(),
      description: String(description).trim(),

      isVerified: false,
      owner: systemUser._id
    });

    res.json({
      ok: true,
      companyId: company._id
    });

  } catch (err) {
    console.error("❌ publicCompanies:", err);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij aanmelden bedrijf"
    });
  }
});

module.exports = router;
