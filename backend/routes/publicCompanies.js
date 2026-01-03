// backend/routes/publicCompanies.js
// v20260103-PUBLIC-COMPANIES-FINAL-FIX

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const { getSystemUser } = require("../utils/systemUser");

function slugifyUnique(name) {
  const base = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now()}`;
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
    const slug = slugifyUnique(name);

    const company = await Company.create({
      name: String(name).trim(),
      slug,

      // 🔽 VERPLICHTE SCHEMA-VELDEN
      email: `${slug}@irisje.nl`,
      status: "pending",
      source: "public",

      categories: categories.map(String),
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      city: String(city).trim(),
      description: String(description).trim(),

      isVerified: false,
      owner: systemUser._id,
    });

    return res.json({ ok: true, companyId: company._id });
  } catch (err) {
    console.error("❌ publicCompanies:", err);
    return res.status(500).json({
      ok: false,
      error: "Serverfout bij aanmelden bedrijf",
    });
  }
});

module.exports = router;
