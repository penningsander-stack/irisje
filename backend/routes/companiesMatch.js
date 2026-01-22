// backend/routes/companiesMatch.js
// Read-only endpoint voor company-mode

const express = require("express");
const router = express.Router();
const matchCompanies = require("../utils/matchCompanies");

router.get("/match", async (req, res) => {
  try {
    const { category, specialty, city } = req.query;

    if (!category || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "category, specialty en city zijn verplicht"
      });
    }

    const result = await matchCompanies({ category, specialty, city });

    res.json({
      ok: true,
      companies: result.companies,
      noLocalResults: result.noLocalResults
    });
  } catch (err) {
    console.error("companiesMatch error:", err);
    res.status(500).json({
      ok: false,
      message: "Kon bedrijven niet ophalen"
    });
  }
});

module.exports = router;
