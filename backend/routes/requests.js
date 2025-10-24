// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const Request = require("../models/Request");
const Company = require("../models/Company");

// --------------------------------------
// GET /api/requests
// Haal aanvragen op van het ingelogde bedrijf
// --------------------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findOne({ owner: userId });
    if (!company)
      return res.status(404).json({ ok: false, error: "Geen bedrijf gevonden" });

    const requests = await Request.find({ company: company._id }).sort({
      createdAt: -1,
    });

    res.json({ ok: true, requests });
  } catch (err) {
    console.error("requests/ GET error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

// --------------------------------------
// POST /api/requests/update-status
// Werk de status bij van een aanvraag
// --------------------------------------
router.post("/update-status", verifyToken, async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status)
      return res.status(400).json({ ok: false, error: "Ontbrekende velden" });

    const userId = req.user.id;
    const company = await Company.findOne({ owner: userId });
    if (!company)
      return res.status(404).json({ ok: false, error: "Geen bedrijf gevonden" });

    const reqDoc = await Request.findOne({ _id: id, company: company._id });
    if (!reqDoc)
      return res.status(404).json({ ok: false, error: "Aanvraag niet gevonden" });

    reqDoc.status = status;
    await reqDoc.save();

    res.json({ ok: true, message: "Status bijgewerkt" });
  } catch (err) {
    console.error("requests/update-status error:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij statusupdate" });
  }
});

module.exports = router;
