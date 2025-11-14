// backend/routes/claims.js
const express = require("express");
const router = express.Router();

const ClaimRequest = require("../models/claimrequest");
const Company = require("../models/company");

/**
 * irisje.nl – claims routes
 * volledig gesynchroniseerd met admin.js
 */

/* ============================================================
   POST /api/claims
   Nieuw claimverzoek indienen
============================================================ */
router.post("/", async (req, res) => {
  try {
    const {
      companyId,
      contactName,
      contactEmail,
      contactPhone,
      kvkNumber,
      methodRequested
    } = req.body;

    if (!companyId || !contactName || !contactEmail) {
      return res.status(400).json({ ok: false, error: "verplichte velden ontbreken" });
    }

    const exists = await Company.findById(companyId);
    if (!exists) {
      return res.status(404).json({ ok: false, error: "bedrijf niet gevonden" });
    }

    const claim = await ClaimRequest.create({
      companyId,
      contactName,
      contactEmail,
      contactPhone: contactPhone || "",
      kvkNumber: kvkNumber || "",
      methodRequested: methodRequested || "email",
      status: "pending"
    });

    return res.json({ ok: true, claimId: claim._id });
  } catch (err) {
    console.error("❌ fout bij claim-aanmaken:", err);
    return res.status(500).json({ ok: false, error: "serverfout bij claim-aanmaken" });
  }
});

/* ============================================================
   GET /api/claims       ← ⭐ NIEUWE ROUTE
   (compatibel met admin.js)
============================================================ */
router.get("/", async (req, res) => {
  try {
    const claims = await ClaimRequest.find({})
      .populate("companyId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      claims
    });
  } catch (err) {
    console.error("❌ fout bij claim-opvragen:", err);
    return res.status(500).json({ ok: false, error: "serverfout bij claim-opvragen" });
  }
});

/* ============================================================
   GET /api/claims/all
   (oude route – mag blijven)
============================================================ */
router.get("/all", async (req, res) => {
  try {
    const claims = await ClaimRequest.find({})
      .populate("companyId", "name city")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      total: claims.length,
      items: claims
    });
  } catch (err) {
    console.error("❌ fout bij claim-opvragen:", err);
    return res.status(500).json({ ok: false, error: "serverfout bij claim-opvragen" });
  }
});

/* ============================================================
   PUT /api/claims/status/:id
   claim-status wijzigen
============================================================ */
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const allowed = ["pending", "verified", "rejected", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "ongeldige status" });
    }

    const updated = await ClaimRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "claim niet gevonden" });
    }

    return res.json({ ok: true, item: updated });
  } catch (err) {
    console.error("❌ fout bij status-update:", err);
    return res.status(500).json({ ok: false, error: "serverfout bij status-update" });
  }
});

module.exports = router;
