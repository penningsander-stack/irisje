// backend/routes/seed.js
// v20260115-SEED-PRODUCTION-SAFE

const express = require("express");
const router = express.Router();
const Company = require("../models/company");

/**
 * 🔐 Beveiliging:
 * Seeden mag ALLEEN als:
 * - x-seed-token header aanwezig is
 * - en exact matcht met process.env.SEED_TOKEN
 */
function checkSeedToken(req, res) {
  const token = req.headers["x-seed-token"];
  if (!token || token !== process.env.SEED_TOKEN) {
    res.status(403).json({ ok: false, error: "Seeden niet toegestaan" });
    return false;
  }
  return true;
}

/**
 * GET /api/seed/seed-companies
 * Seed voorbeeldbedrijven (eenmalig, idempotent)
 */
router.get("/seed-companies", async (req, res) => {
  try {
    if (!checkSeedToken(req, res)) return;

    // Bestaat er al minimaal één advocatenbedrijf?
    const exists = await Company.findOne({
      categories: /advocaat/i
    }).lean();

    if (exists) {
      return res.json({
        ok: true,
        message: "Seed is al uitgevoerd, geen actie nodig"
      });
    }

    const companies = await Company.insertMany([
      {
        name: "Test Arbeidsrecht Advocaat",
        slug: "test-arbeidsrecht-advocaat",
        city: "Utrecht",
        categories: ["advocaat"],
        specialties: ["arbeidsrecht"],
        active: true,
        isVerified: true,
        avgRating: 4.6,
        reviewCount: 12
      },
      {
        name: "Juridisch Adviesbureau Nederland",
        slug: "juridisch-adviesbureau-nederland",
        city: "Rotterdam",
        categories: ["advocaat"],
        specialties: ["arbeidsrecht", "ontslagrecht"],
        active: true,
        isVerified: false,
        avgRating: 4.3,
        reviewCount: 8
      }
    ]);

    res.json({
      ok: true,
      inserted: companies.length
    });
  } catch (err) {
    console.error("❌ seed error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
