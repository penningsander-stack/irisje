// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const { verifyToken } = require("../middleware/auth");

/**
 * 📋 Alle aanvragen ophalen van het ingelogde bedrijf
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id; // uit token
    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json({ ok: true, items: requests });
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

/**
 * 🔄 Status van een aanvraag aanpassen
 */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Request.findOneAndUpdate(
      { _id: req.params.id, company: req.user.id },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });
    res.json({ ok: true, item: updated });
  } catch (err) {
    console.error("❌ Fout bij updaten status:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij updaten status" });
  }
});

module.exports = router;
