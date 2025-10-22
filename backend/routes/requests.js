// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const Company = require("../models/Company");
const auth = require("../middleware/auth");

// ✅ Aanvragen ophalen voor het ingelogde bedrijf
router.get("/", auth, async (req, res) => {
  try {
    // Zoek het bedrijf van de ingelogde gebruiker
    const company = await Company.findOne({ owner: req.user.id });

    let requests = [];
    if (company) {
      // Normaal bedrijf: toon alleen eigen aanvragen
      requests = await Request.find({ company: company._id }).sort({ createdAt: -1 });
    } else {
      // Demo fallback: toon alles voor demo@irisje.nl
      const demoUser = req.user?.email === "demo@irisje.nl";
      if (demoUser) {
        requests = await Request.find().sort({ createdAt: -1 });
      } else {
        return res.status(403).json({ ok: false, message: "Geen bedrijf gekoppeld" });
      }
    }

    res.json({ ok: true, items: requests });
  } catch (err) {
    console.error("Fout bij ophalen aanvragen:", err);
    res.status(500).json({ ok: false, message: "Serverfout" });
  }
});

module.exports = router;
