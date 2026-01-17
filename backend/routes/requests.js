// backend/routes/requests.js
// v20251213-REQUESTS-WITH-CREATE
//
// Routes voor offerte-aanvragen:
// - POST   /api/requests              → nieuwe aanvraag / meerdere aanvragen
// - GET    /api/requests              → alle aanvragen voor ingelogd bedrijf
// - GET    /api/requests/company/:id  → aanvragen per bedrijf (publiek)
// - PUT    /api/requests/:id/status   → status bijwerken (ingelogd bedrijf)

const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const verifyToken = require("../middleware/auth");

// ============================================================
//  📨 Nieuwe aanvraag / meerdere aanvragen (publiek)
// ============================================================
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      city,
      message,
      category,
      specialty,
      communication,
      experience,
      approach,
      involvement,
      companyId,
      companyIds
    } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Naam, e-mail en omschrijving zijn verplicht."
      });
    }

    // Bepaal voor welke bedrijven de aanvraag wordt aangemaakt
    let targets = [];
    if (Array.isArray(companyIds) && companyIds.length) {
      targets = companyIds.filter(Boolean);
    } else if (companyId) {
      targets = [companyId];
    }

    const baseData = {
      name,
      email,
      city: city || "",
      message,
      category: category || "",
      specialty: specialty || "",
      communication: communication || "",
      experience: experience || "",
      approach: approach || "",
      involvement: involvement || ""
      // status en date worden via defaults in het model gezet
    };

    let created;

    if (targets.length) {
      // Maak één aanvraag per gekozen bedrijf (Trustoo-stijl, max ~5)
      const docs = targets.map((id) => ({
        ...baseData,
        company: id
      }));
      created = await Request.insertMany(docs);

      return res.status(201).json({
        ok: true,
        type: "multi",
        total: created.length,
        items: created
      });
    } else {
      // Algemene aanvraag zonder gekoppeld bedrijf (company = null)
      created = await Request.create(baseData);

      return res.status(201).json({
        ok: true,
        type: "single",
        item: created
      });
    }
  } catch (error) {
    console.error("❌ Fout bij aanmaken aanvraag:", error);
    res
      .status(500)
      .json({ ok: false, message: "Serverfout bij aanmaken aanvraag" });
  }
});

// ============================================================
//  📋 Alle aanvragen ophalen (alleen ingelogde gebruiker)
// ============================================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user?.id;

    // Alleen aanvragen van dit bedrijf of algemene aanvragen
    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }]
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, total: requests.length, items: requests });
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen:", error);
    res
      .status(500)
      .json({ ok: false, error: "Serverfout bij ophalen aanvragen" });
  }
});

// ============================================================
//  📋 Aanvragen per bedrijf ophalen (publiek endpoint)
// ============================================================
router.get("/company/:id", async (req, res) => {
  try {
    const companyId = req.params.id;

    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }]
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!requests?.length) {
      return res
        .status(404)
        .json({ ok: false, message: "Geen aanvragen gevonden." });
    }

    res.json({ ok: true, total: requests.length, items: requests });
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen per bedrijf:", error);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen aanvragen per bedrijf"
    });
  }
});

// ============================================================
//  📦 Aanvraagstatus bijwerken (alleen eigenaar)
// ============================================================
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res
        .status(404)
        .json({ ok: false, message: "Aanvraag niet gevonden." });
    }

    // Alleen eigenaar (bedrijf) mag de eigen aanvraagstatus wijzigen
    if (request.company?.toString() !== req.user.id) {
      return res.status(403).json({ ok: false, message: "Geen toegang." });
    }

    request.status = status;
    await request.save();

    res.json({ ok: true, message: "Status bijgewerkt.", request });
  } catch (error) {
    console.error("❌ Fout bij updaten status:", error);
    res
      .status(500)
      .json({ ok: false, error: "Serverfout bij updaten status" });
  }
});

module.exports = router;
