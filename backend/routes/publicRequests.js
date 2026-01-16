// backend/routes/publicRequests.js
// v2026-01-16 – FINAL: case-insensitive category matching + proof log

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

/**
 * Aanvraag aanmaken
 */
router.post("/", async (req, res) => {
  try {
    const { sector, specialty, city } = req.body;

    if (!sector) {
      return res.status(400).json({ error: "Sector ontbreekt" });
    }

    const request = await requestModel.create({
      sector,
      specialty: specialty || "",
      city: city || "",
    });

    res.json({ requestId: request._id });
  } catch (err) {
    console.error("❌ POST /publicRequests error:", err);
    res.status(500).json({ error: "Aanvraag kon niet worden aangemaakt" });
  }
});

/**
 * Resultaten ophalen
 */
router.get("/:id", async (req, res) => {
  try {
    console.log("🔥 publicRequests route HIT"); // 👈 bewijs dat deze code draait

    const request = await requestModel.findById(req.params.id).lean();

    if (!request) {
      return res.status(404).json({ error: "Aanvraag niet gevonden" });
    }

    const companies = await companyModel.find({
      categories: {
  $elemMatch: {
    $regex: request.sector,
    $options: "i",
  },
},

      active: true,
    }).lean();

    console.log("🔥 MATCH sector:", request.sector);
    console.log("🔥 FOUND companies:", companies.length);

    res.json({
      request,
      companies,
    });
  } catch (err) {
    console.error("❌ GET /publicRequests/:id error:", err);
    res.status(500).json({ error: "Resultaten konden niet worden opgehaald" });
  }
});

module.exports = router;
