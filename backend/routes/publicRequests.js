// backend/routes/publicRequests.js
// v20260116-FIX-PUBLICREQUESTS-NO-MODEL

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// ============================================================
//  📨 Zoek-aanvraag starten (zonder database)
// ============================================================
router.post("/", (req, res) => {
  try {
    const { sector, city, specialty } = req.body || {};

    if (!sector || !city) {
      return res.status(400).json({
        ok: false,
        message: "Sector en plaats zijn verplicht."
      });
    }

    // ✔️ Tijdelijk maar geldig requestId
    const requestId = new mongoose.Types.ObjectId().toString();

    return res.status(201).json({
      ok: true,
      requestId
    });

  } catch (error) {
    console.warn("❌ publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij starten aanvraag"
    });
  }
});

module.exports = router;
