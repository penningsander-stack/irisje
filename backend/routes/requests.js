// backend/routes/requests.js
const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/auth");
const Request = require("../models/Request");
const Company = require("../models/Company");

// ✅ Alle aanvragen van het ingelogde bedrijf
router.get("/", verifyToken, async (req, res) => {
  try {
    // Vind het bedrijf dat hoort bij de ingelogde user
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) {
      // Geen bedrijf gekoppeld aan user → lege lijst terug (dashboard blijft gewoon werken)
      return res.json({ ok: true, items: [] });
    }

    const items = await Request.find({ company: company._id }).sort({ createdAt: -1 });
    return res.json({ ok: true, items });
  } catch (err) {
    console.error("Fout bij ophalen aanvragen:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

// ✅ Status van een aanvraag bijwerken (optioneel gebruikt)
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ ok: false, error: "Status ontbreekt" });

    // Zekerstellen dat de aanvraag bij dit bedrijf hoort
    const company = await Company.findOne({ owner: req.user.id });
    if (!company) return res.status(403).json({ ok: false, error: "Geen bedrijf gekoppeld" });

    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, company: company._id },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });

    return res.json({ ok: true, item: updated });
  } catch (err) {
    console.error("Fout bij updaten status:", err);
    return res.status(500).json({ ok: false, error: "Serverfout bij updaten status" });
  }
});

module.exports = router;
