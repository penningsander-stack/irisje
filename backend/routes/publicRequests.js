// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();
const PublicRequest = require("../models/publicRequest");

// ============================================================
//  📨 Zoek-aanvraag aanmaken (publiek, MET id)
// ============================================================
router.post("/", async (req, res) => {
  try {
    const { sector, city, specialty } = req.body || {};

    if (!sector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector en plaats zijn verplicht."
      });
    }

    const created = await PublicRequest.create({
      sector,
      city,
      specialty: specialty || ""
    });

    return res.status(201).json({
      ok: true,
      requestId: created._id.toString()
    });

  } catch (error) {
    console.warn("❌ publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij aanmaken zoek-aanvraag"
    });
  }
});

module.exports = router;
