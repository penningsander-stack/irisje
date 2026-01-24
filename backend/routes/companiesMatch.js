// backend/routes/companiesMatch.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");

/*
 * GET /api/companies/match
 * ?category=Advocaat&specialty=Arbeidsrecht&city=Amsterdam
 */
router.get("/match", async (req, res) => {
  try {
    const { category, specialty, city } = req.query;

    if (!category || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "category, specialty en city zijn verplicht"
      });
    }

    const companies = await Company.find({
      active: true,
      city,
      $and: [
        {
          $or: [
            { category },
            { categories: { $in: [category] } }
          ]
        },
        {
          $or: [
            { specialties: { $exists: false } },
            { specialties: { $size: 0 } },
            { specialties: { $in: [specialty] } }
          ]
        }
      ]
    })
      .select("name slug city categories specialties")
      .limit(50)
      .lean();

    return res.json({ ok: true, companies });
  } catch (err) {
    console.error("companiesMatch error:", err);
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

module.exports = router;
