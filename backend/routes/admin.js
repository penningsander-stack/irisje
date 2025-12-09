// backend/routes/admin.js
// v20251209-FULL-CLEAN + AUTO-LOGO-FIX ENDPOINT

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// MODELS
const Company = require("../models/company");
const Review = require("../models/review");
const Request = require("../models/request");
const User = require("../models/user");

// ------------------------------------------------------------
// ADMIN AUTH CHECK
// ------------------------------------------------------------
router.use(async (req, res, next) => {
  try {
    // Alleen JWT controleren als admin-auth verplicht is
    // Als je dit wilt uitschakelen, verwijder dan deze block
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: "Admin authenticatie vereist"
      });
    }

    const decoded = auth.verifyToken(token.replace("Bearer ", ""));
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "Geen toegang (admin vereist)"
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      ok: false,
      error: "Ongeldige token"
    });
  }
});

// ------------------------------------------------------------
// ADMIN: DASHBOARD STATISTIEKEN
// ------------------------------------------------------------
router.get("/stats", async (req, res) => {
  try {
    const totalCompanies = await Company.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalRequests = await Request.countDocuments();
    const verifiedCompanies = await Company.countDocuments({ isVerified: true });

    return res.json({
      ok: true,
      totalCompanies,
      verifiedCompanies,
      totalReviews,
      totalRequests
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------
// ADMIN: BEDRIJVEN BEHEEREN
// ------------------------------------------------------------

// Alle bedrijven ophalen
router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.json({ ok: true, companies });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Bedrijf op ID ophalen
router.get("/companies/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company)
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });

    return res.json({ ok: true, company });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Bedrijf bijwerken
router.put("/companies/:id", async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    if (!updated)
      return res.status(404).json({ ok: false, error: "Bedrijf niet gevonden" });

    return res.json({ ok: true, company: updated });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------
// ADMIN: REVIEW MANAGEMENT
// ------------------------------------------------------------

// Opgeklopte / gemelde reviews bekijken
router.get("/reviews/reported", async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true }).sort({
      createdAt: -1
    });
    return res.json({ ok: true, reviews });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Review markeren als "bekeken"
router.post("/reviews/:id/resolve", async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: false },
      { new: true }
    );

    if (!review)
      return res.status(404).json({ ok: false, error: "Review niet gevonden" });

    return res.json({ ok: true, review });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------
// ADMIN: REQUEST MANAGEMENT
// ------------------------------------------------------------

// Alle aanvragen (met filters)
router.get("/requests", async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.companyId) filter.company = req.query.companyId;

    const requests = await Request.find(filter)
      .populate("company")
      .sort({ createdAt: -1 });

    return res.json({ ok: true, requests });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ------------------------------------------------------------
// ADMIN: AUTO-LOGO FIX (NIEUW)
// ------------------------------------------------------------
router.post("/fix-logos", async (req, res) => {
  try {
    const mapping = {
      aannemer: "uploads/company-logos/aannemer.svg",
      advocaat: "uploads/company-logos/advocaat.svg",
      airco: "uploads/company-logos/airco.svg",
      bouwbedrijf: "uploads/company-logos/bouwbedrijf.svg",
      dakdekker: "uploads/company-logos/dakdekker.svg",
      duurzaam: "uploads/company-logos/duurzaam.svg",
      elektricien: "uploads/company-logos/elektricien.svg",
      glaszetter: "uploads/company-logos/glaszetter.svg",
      hovenier: "uploads/company-logos/hovenier.svg",
      installatie: "uploads/company-logos/installatie.svg",
      isolatie: "uploads/company-logos/isolatie.svg",
      klusbedrijf: "uploads/company-logos/klusbedrijf.svg",
      loodgieter: "uploads/company-logos/loodgieter.svg",
      schilder: "uploads/company-logos/schilder.svg",
      schoonmaakbedrijf: "uploads/company-logos/schoonmaakbedrijf.svg",
      slotenmaker: "uploads/company-logos/slotenmaker.svg",
      spoedservice: "uploads/company-logos/spoedservice.svg",
      stukadoor: "uploads/company-logos/stukadoor.svg",
      tegelzetter: "uploads/company-logos/tegelzetter.svg",
      timmerman: "uploads/company-logos/timmerman.svg",
      vloeren: "uploads/company-logos/vloeren.svg",
      woninginrichting: "uploads/company-logos/woninginrichting.svg",
      zonnepanelen: "uploads/company-logos/zonnepanelen.svg"
    };

    const companies = await Company.find();
    let updated = 0;

    for (const c of companies) {
      if (c.logo) continue;

      const cat = (c.categories || []).join(" ").toLowerCase();

      for (const key of Object.keys(mapping)) {
        if (cat.includes(key)) {
          c.logo = mapping[key];
          await c.save();
          updated++;
          break;
        }
      }
    }

    return res.json({
      ok: true,
      updated,
      message: `Logo's automatisch toegewezen aan ${updated} bedrijven`
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});

// ------------------------------------------------------------
module.exports = router;
