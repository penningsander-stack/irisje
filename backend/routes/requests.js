// backend/routes/requests.js

const express = require("express");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

router.post("/", async (req, res) => {
  try {
    const { name, email, message, category, city, companyIds } = req.body;

    if (
      !name ||
      !email ||
      !message ||
      !category ||
      !city ||
      !Array.isArray(companyIds) ||
      companyIds.length === 0
    ) {
      return res.status(400).json({
        ok: false,
        message: "Ontbrekende of ongeldige velden"
      });
    }

    // ✔️ alleen bestaande bedrijven ophalen
    const companies = await Company.find({
      _id: { $in: companyIds }
    }).lean();

    if (!companies.length) {
      return res.status(400).json({
        ok: false,
        message: "Geen geldige bedrijven gevonden"
      });
    }

    const request = await Request.create({
  name,
  email,
  message,
  sector,        // ← deze regel toevoegen
  category,
  city,
  companies: companies.map(c => c._id)
});


    return res.json({
      ok: true,
      type: companies.length > 1 ? "multi" : "single",
      total: companies.length,
      items: companies.map(c => ({
        _id: c._id,
        name: c.name,
        email: c.email || null
      }))
    });

  } catch (error) {
    console.error("❌ POST /api/requests error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij aanmaken aanvraag"
    });
  }
});

module.exports = router;
