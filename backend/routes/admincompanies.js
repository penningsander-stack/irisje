// backend/routes/admincompanies.js
const express = require("express");
const router = express.Router();

const company = require("../models/company");

/* ============================================================
   GET /api/admin/overview
   Alle bedrijven voor beheerdersdashboard
============================================================ */
router.get("/overview", async (req, res) => {
  try {
    const companies = await company
      .find({})
      .populate("owner", "email name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      ok: true,
      total: companies.length,
      companies,
    });
  } catch (err) {
    console.error("❌ Fout bij admin-overzicht:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij ophalen bedrijven." });
  }
});

/* ============================================================
   PUT /api/admin/verify/:id
   Toggle verificatie (isVerified true/false)
============================================================ */
router.put("/verify/:id", async (req, res) => {
  try {
    const c = await company.findById(req.params.id);

    if (!c) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    c.isVerified = !c.isVerified;
    await c.save();

    res.json({ ok: true, company: c });
  } catch (err) {
    console.error("❌ Fout bij verify:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij verificatie-update." });
  }
});

/* ============================================================
   DELETE /api/admin/company/:id
   Beheerder verwijdert een bedrijf volledig
============================================================ */
router.delete("/company/:id", async (req, res) => {
  try {
    const deleted = await company.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden." });
    }

    res.json({ ok: true, message: "Bedrijf verwijderd." });
  } catch (err) {
    console.error("❌ Fout bij bedrijf-verwijderen:", err);
    res.status(500).json({ ok: false, error: "Serverfout bij bedrijf-verwijderen." });
  }
});

module.exports = router;
