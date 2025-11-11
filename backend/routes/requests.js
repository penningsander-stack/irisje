// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const verifyToken = require("../middleware/auth"); // ✅ correcte import

/* ============================================================
   📋 Alle aanvragen ophalen (alleen ingelogde gebruiker)
============================================================ */
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user?.id;

    // ✅ Alleen aanvragen van dit bedrijf of algemene aanvragen
    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, total: requests.length, items: requests });
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

/* ============================================================
   📋 Aanvragen per bedrijf ophalen (publiek endpoint)
============================================================ */
router.get("/company/:id", async (req, res) => {
  try {
    const companyId = req.params.id;

    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }],
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!requests?.length) {
      return res.status(404).json({ ok: false, message: "Geen aanvragen gevonden." });
    }

    res.json({ ok: true, total: requests.length, items: requests });
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen per bedrijf:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen aanvragen per bedrijf" });
  }
});

/* ============================================================
   📦 Aanvraagstatus bijwerken (alleen eigenaar)
============================================================ */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ ok: false, message: "Aanvraag niet gevonden." });
    }

    // ✅ Optioneel: alleen eigenaar kan bijwerken
    if (request.company?.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, message: "Geen toegang." });
    }

    request.status = status;
    await request.save();

    res.json({ ok: true, message: "Status bijgewerkt.", request });
  } catch (error) {
    console.error("❌ Fout bij updaten status:", error);
    res.status(500).json({ ok: false, error: "Serverfout bij updaten status" });
  }
});

module.exports = router;
