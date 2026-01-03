// backend/routes/publicCompanies.js
// v20260103-PUBLIC-COMPANIES-SLUG-OWNER-FIX

const express = require("express");
const router = express.Router();

const Company = require("../models/company.js");
const { getSystemUser } = require("../utils/systemUser");

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

router.post("/", async (req, res) => {
  try {
    const { name, categories, specialties, city, description } = req.body;

    if (
      !name ||
      !Array.isArray(categories) ||
      categories.length === 0 ||
      !city ||
      !description
    ) {
      return res.status(400).json({
        ok: false,
        error: "Ontbrekende verplichte velden",
      });
    }

    const systemUser = await getSystemUser();

    const slug = slugify(name) + "-" + Date.now();

    const company = await Company.create({
      name: String(name).trim(),
      slug,
      categories: categories.map(String),
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      city: String(city).trim(),
      description: String(description).trim(),
      isVerified: false,
      owner: systemUser._id,
    });

    res.json({ ok: true, companyId: company._id });
  } catch (err) {
    console.error("❌ publicCompanies:", err);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij aanmelden bedrijf",
    });
  }
});

module.exports = router;
