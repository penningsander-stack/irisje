// backend/routes/publicCompanies.js
// v20260103-PUBLIC-COMPANIES

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");

/**
 * POST /api/publicCompanies
 * Publieke aanmelding van bedrijf (zonder login)
 * Wordt als "pending" aangemaakt
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

    if (!name || !Array.isArray(categories) || !categories.length || !city || !description) {
      return res.status(400).json({
        ok: false,
        error: "Ontbrekende verplichte velden"
      });
    }

    const company = await Company.create({
      name: String(name).trim(),
      categories: categories.map(String),
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      city: String(city).trim(),
      description: String(description).trim(),

      // 👇 expliciet: nog niet actief / niet geverifieerd
      isVerified: false,

      // 👇 owner is verplicht in schema → dummy placeholder
      owner: null
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
