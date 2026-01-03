// backend/routes/publicCompanies.js
// v20260103-PUBLIC-COMPANIES-FINAL

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const { getSystemUser } = require("../utils/systemUser");

// Uniek + veilig sluggen
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

    // 👇 altijd geldige owner
    const systemUser = await getSystemUser();

    const company = await Company.create({
      name: String(name).trim(),
      slug: slugifyUnique(name),          // 👈 verplicht + uniek
      categories: categories.map(String),
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      city: String(city).trim(),
      description: String(description).trim(),
      isVerified: false,
      owner: systemUser._id,              // 👈 verplicht
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
