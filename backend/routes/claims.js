// backend/routes/claims.js
const express = require("express");
const router = express.Router();

const claimrequest = require("../models/claimrequest");
const company = require("../models/company");

/* ============================================================
   POST /api/claims
   Nieuw claimverzoek indienen door een bedrijf
============================================================ */
router.post("/", async (req, res) => {
  try {
    const { contactname, contactemail, contactphone, message, companyid } = req.body;

    if (!companyid || !contactname || !contactemail) {
      return res
        .status(400)
        .json({ ok: false, error: "Verplichte velden ontbreken." });
    }

    const exists = await company.findById(companyid);
    if (!exists) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    const claim = await claimrequest.create({
      companyid,
      contactname,
      contactemail,
      contactphone,
      message,
      status: "pending",
      createdAt: new Date()
    });

    res.json({ ok: true, claimid: claim._id });
  } catch (err) {
    console.error("❌ Fout bij claim-aanmaken:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij claim-aanmaken." });
  }
});

/* ============================================================
   GET /api/claims/all
   Alle claimverzoeken voor beheerder
============================================================ */
router.get("/all", async (req, res) => {
  try {
    const claims = await claimrequest
      .find({})
      .populate("companyid", "name city")
      .sort({ createdAt: -1 })
      .lean();

    res.json(claims);
  } catch (err) {
    console.error("❌ Fout bij claim-opvragen:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij claim-opvragen." });
  }
});

/* ============================================================
   PUT /api/claims/status/:id
   Admin verandert status (pending → verified/rejected)
============================================================ */
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "verified", "rejected"].includes(status)) {
      return res.status(400).json({ ok: false, error: "Ongeldige statuswaarde." });
    }

    const updated = await claimrequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "Claim niet gevonden." });
    }

    res.json({ ok: true, claim: updated });
  } catch (err) {
    console.error("❌ Fout bij status-update:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij status-update." });
  }
});

module.exports = router;
