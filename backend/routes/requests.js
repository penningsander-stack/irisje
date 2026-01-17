// backend/routes/requests.js
// v20260117-REQUESTS-HOTFIX-SECTOR-FROM-PUBLICREQUEST

const express = require("express");
const router = express.Router();
const Request = require("../models/request");
const PublicRequest = require("../models/publicRequest"); // bestaand model
const verifyToken = require("../middleware/auth");

// ============================================================
//  📨 Nieuwe aanvraag / meerdere aanvragen (publiek)
// ============================================================
router.post("/", async (req, res) => {
  try {
    const {
      requestId,            // ← nodig om sector te herleiden
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

    // ----------------------------------------------------------
    // 🔧 HOTFIX: sector halen uit bestaande publicRequest
    // ----------------------------------------------------------
    let sector = "";

    if (requestId) {
      const publicReq = await PublicRequest.findById(requestId)
        .select("sector")
        .lean();

      if (publicReq && publicReq.sector) {
        sector = String(publicReq.sector);
      }
    }

    if (!sector) {
      return res.status(400).json({
        ok: false,
        message: "Aanvraagcontext ontbreekt (sector niet gevonden)."
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
      sector,                       // ← nu altijd geldig
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
      // status en date via defaults in het model
    };

    let created;

    if (targets.length) {
      // Maak één aanvraag per gekozen bedrijf (Trustoo-stijl)
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
      // Algemene aanvraag zonder gekoppeld bedrijf
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
