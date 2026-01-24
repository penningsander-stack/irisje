const express = require("express");
const router = express.Router();

const Request = require("../models/request"); // ⚠️ lowercase, afspraak
const Company = require("../models/company");

/* ======================================================
   POST /api/publicRequests
   ====================================================== */
router.post("/", async (req, res) => {
  try {
    const { sector, category, specialty, city } = req.body || {};
    const finalSector = sector || category;

    if (!finalSector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector en plaats zijn verplicht.",
      });
    }

    const created = await Request.create({
      sector: finalSector,
      category: finalSector,
      specialty: specialty || "",
      city,
    });

    return res.status(201).json({
      ok: true,
      request: {
        _id: created._id,
        sector: created.sector,
        specialty: created.specialty,
        city: created.city,
      },
    });
  } catch (error) {
    console.error("publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij aanmaken aanvraag",
    });
  }
});

/* ======================================================
   GET /api/publicRequests/:id
   ====================================================== */
router.get("/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");

if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    ok: false,
    message: "Ongeldige aanvraag-ID",
  });
}

const request = await Request.findById(req.params.id).lean();


    if (!request) {
      return res.status(404).json({
        ok: false,
        message: "Aanvraag niet gevonden",
      });
    }

    const sector = request.sector || request.category;
    const specialty = request.specialty;
    const city = request.city;

    if (!sector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Aanvraag mist sector of plaats",
      });
    }

    // 🔑 CORE FIX: specialty mag NIET blokkeren
    const companies = await Company.find({
      active: true,
      isVerified: true,
      city: city,
      categories: { $in: [sector] },
      $or: [
        { specialties: { $exists: false } },
        { specialties: { $size: 0 } },
        { specialties: { $in: [specialty] } },
      ],
    }).lean();

    return res.json({
      ok: true,
      request: {
        _id: request._id,
        sector,
        specialty,
        city,
      },
      companies,
    });
  } catch (error) {
    console.error("publicRequests GET error:", error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
});

module.exports = router;
