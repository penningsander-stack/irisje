// backend/routes/publicRequests.js
// v20260116-FIX-PUBLIC-REQUEST-FLOW

const express = require("express");
const router = express.Router();
const Request = require("../models/request");

// ============================================================
//  🔍 Zoek-aanvraag ophalen (GEEN nieuwe Request maken)
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

    // ❗️Hier GEEN Request.create()
    // Deze endpoint is alleen bedoeld voor zoeken / matchen

    return res.json({
      ok: true,
      search: {
        sector,
        city,
        specialty: specialty || ""
      }
    });

  } catch (error) {
    console.warn("❌ publicRequests POST error:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij zoek-aanvraag"
    });
  }
});

module.exports = router;
