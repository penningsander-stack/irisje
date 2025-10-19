// backend/routes/requests.js
const express = require("express");
const auth = require("../middleware/auth");
const Request = require("../models/Request");
const Company = require("../models/Company");

const router = express.Router();

// ✅ Haal aanvragen van het ingelogde bedrijf op
router.get("/company", auth, async (req, res) => {
  try {
    // Token bevat mogelijk geen companyId, dan koppelen via e-mail
    const companyId = req.user.companyId;
    let company = null;

    if (companyId) {
      company = await Company.findById(companyId);
    } else if (req.user.email) {
      company = await Company.findOne({ email: req.user.email });
    }

    if (!company) {
      return res.status(404).json({ error: "Geen bedrijf gevonden voor deze gebruiker" });
    }

    const requests = await Request.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

// ✅ Status van aanvraag wijzigen
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Geen status opgegeven" });

    const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    res.json({ message: "Status bijgewerkt", request: updated });
  } catch (err) {
    console.error("❌ Fout bij status-update:", err);
    res.status(500).json({ error: "Serverfout bij bijwerken status" });
  }
});

module.exports = router;
