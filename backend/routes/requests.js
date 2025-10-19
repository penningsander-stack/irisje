// backend/routes/requests.js
const express = require("express");
const auth = require("../middleware/auth");
const Request = require("../models/Request");

const router = express.Router();

// ✅ Haal aanvragen van het ingelogde bedrijf op
router.get("/company", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ error: "Geen bedrijf gekoppeld aan gebruiker" });

    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 }).lean();
    return res.json(requests);
  } catch (err) {
    console.error("Fout bij ophalen aanvragen:", err);
    res.status(500).json({ error: "Serverfout bij ophalen aanvragen" });
  }
});

// ✅ Update status van aanvraag
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Geen status opgegeven" });

    const updated = await Request.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: "Aanvraag niet gevonden" });

    res.json({ message: "Status bijgewerkt", request: updated });
  } catch (err) {
    console.error("Fout bij bijwerken status:", err);
    res.status(500).json({ error: "Serverfout bij bijwerken status" });
  }
});

module.exports = router;
