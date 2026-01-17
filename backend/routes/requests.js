// backend/routes/requests.js
// v20260117-REQUESTS-HOTFIX-SECTOR-FROM-REQUEST

const express = require("express");
const router = express.Router();

const Request = require("../models/request"); // hetzelfde model als publicRequests
const verifyToken = require("../middleware/auth");

// ============================================================
//  📨 Nieuwe aanvraag / meerdere aanvragen (publiek)
// ============================================================
router.post("/", async (req, res) => {
  try {
    const {
      requestId,            // ← ID van public request
      name,
      email,
      city,
      message,
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

    // ----------------------------------------------------------
    // 🔧 sector ophalen uit bestaand request (publicRequests)
    // ----------------------------------------------------------
    if (!requestId) {
      return res.status(400).json({
        ok: false,
        message: "requestId ontbreekt."
      });
    }

    const sourceRequest = await Request.findById(requestId).lean();
    if (!sourceRequest || !sourceRequest.sector) {
      return res.status(400).json({
        ok: false,
        message: "Ongeldige aanvraagcontext (sector niet gevonden)."
      });
    }

    const sector = String(sourceRequest.sector).trim();
    if (!sector) {
      return res.status(400).json({
        ok: false,
        message: "Ongeldige sector in aanvraag."
      });
    }

    // ----------------------------------------------------------
    // Bepaal doelbedrijven
    // ----------------------------------------------------------
    let targets = [];
    if (Array.isArray(companyIds) && companyIds.length) {
      targets = companyIds.filter(Boolean);
    } else if (companyId) {
      targets = [companyId];
    }

    const baseData = {
      sector,
      name,
      email,
      city: city || sourceRequest.city || "",
      message,
      specialty: specialty || sourceRequest.specialty || "",
      communication: communication || "",
      experience: experience || "",
      approach: approach || "",
      involvement: involvement || ""
    };

    let created;

    if (targets.length) {
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
      created = await Request.create(baseData);

      return res.status(201).json({
        ok: true,
        type: "single",
        item: created
      });
    }

  } catch (error) {
    console.error("❌ Fout bij aanmaken aanvraag:", error);
    return res.status(500).json({
      ok: false,
      message: "Serverfout bij aanmaken aanvraag"
    });
  }
});

// ============================================================
//  📋 Alle aanvragen ophalen (alleen ingelogde gebruiker)
// ============================================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const companyId = req.user?.id;

    const requests = await Request.find({
      $or: [{ company: companyId }, { company: null }]
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, total: requests.length, items: requests });
  } catch (error) {
    console.error("❌ Fout bij ophalen aanvragen:", error);
    res.status(500).json({
      ok: false,
      error: "Serverfout bij ophalen aanvragen"
    });
  }
});

module.exports = router;
