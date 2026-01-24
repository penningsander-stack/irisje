// backend/routes/publicRequests.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Request = require("../models/request");
const Company = require("../models/company");

/* =========================
 * POST /api/publicRequests
 * ========================= */
router.post("/", async (req, res) => {
  try {
    const { sector, category, specialty, city } = req.body || {};
    const finalSector = sector || category;

    if (!finalSector || !specialty || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector, specialisme en plaats zijn verplicht."
      });
    }

    const created = await Request.create({
      sector: finalSector,
      category: finalSector,
      specialty,
      city
    });

    return res.status(201).json({
      ok: true,
      request: {
        _id: created._id,
        sector: created.sector,
        specialty: created.specialty,
        city: created.city
      }
    });
  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

/* =========================
 * GET /api/publicRequests/:id
 * ========================= */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, message: "Ongeldig requestId" });
    }

    const request = await Request.findById(id).lean();
    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden" });
    }

    const category = request.sector || request.category;
    const specialty = request.specialty;
    const city = request.city;

    // **Plaats eerst**, daarna categorie + specialisme
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
      .lean();

    return res.json({
      ok: true,
      request: {
        _id: request._id,
        sector: category,
        specialty,
        city
      },
      companies
    });
  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

module.exports = router;
