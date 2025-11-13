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
    const {
      companyid,
      contactname,
      contactemail,
      contactphone,
      kvknumber,
      methodrequested
    } = req.body;

    if (!companyid || !contactname || !contactemail) {
      return res
        .status(400)
        .json({ ok: false, error: "verplichte velden ontbreken" });
    }

    const exists = await company.findById(companyid);
    if (!exists) {
      return res.status(404).json({ ok: false, error: "bedrijf niet gevonden" });
    }

    const claim = await claimrequest.create({
      companyid,
      contactname,
      contactemail,
      contactphone,
      kvknumber: kvknumber || "",
      methodrequested: methodrequested || "email",
      status: "pending"
    });

    res.json({ ok: true, claimid: claim._id });
  } catch (err) {
    console.error("❌ fout bij claim-aanmaken:", err);
    res.status(500).json({ ok: false, error: "serverfout bij claim-aanmaken" });
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

    res.json({
      ok: true,
      total: claims.length,
      items: claims
    });
  } catch (err) {
    console.error("❌ fout bij claim-opvragen:", err);
    res.status(500).json({ ok: false, error: "serverfout bij claim-opvragen" });
  }
});

/* ============================================================
   PUT /api/claims/status/:id
   Admin verandert status (pending → verified/rejected)
============================================================ */
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "verified", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({ ok: false, error: "ongeldige status" });
    }

    const updated = await claimrequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "claim niet gevonden" });
    }

    res.json({ ok: true, item: updated });
  } catch (err) {
    console.error("❌ fout bij status-update:", err);
    res.status(500).json({ ok: false, error: "serverfout bij status-update" });
  }
});

module.exports = router;
