// backend/routes/admin.js
// v20251210-ADMIN-BACKEND-LOGS-ALIGN
//
// Deze versie is afgestemd op de nieuwe frontend/js/admin.js:
// - behoudt bestaande endpoints (companies, reported-reviews, claims)
// - voegt GET /api/admin/logs toe, op basis van utils/logger.getLogs()

const express = require("express");
const router = express.Router();

const { authMiddleware, requireAdmin } = require("../middleware/auth");

const Company = require("../models/company");
const Review = require("../models/review");
const Request = require("../models/request");
const Claim = require("../models/claim");
const { getLogs } = require("../utils/logger");

// ADMIN AUTH – alle routes hieronder vereisen admin
router.use(authMiddleware, requireAdmin);

// GET companies
router.get("/companies", async (req, res) => {
  try {
    const companies = await Company.find({})
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({ ok: true, companies });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon bedrijven niet ophalen",
      details: err.message,
    });
  }
});

// GET reported reviews
router.get("/reported-reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({ ok: true, reviews });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon gemelde reviews niet ophalen",
      details: err.message,
    });
  }
});

// clear review report
router.post("/reported-reviews/:id/clear", async (req, res) => {
  try {
    const updated = await Review.findByIdAndUpdate(
      req.params.id,
      { reported: false },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({
        ok: false,
        error: "Review niet gevonden",
      });
    }

    return res.json({
      ok: true,
      message: "Melding verwijderd",
      review: updated,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon melding niet verwijderen",
      details: err.message,
    });
  }
});

// GET claims
router.get("/claims", async (req, res) => {
  try {
    const claims = await Claim.find({})
      .populate("companyId")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.json({ ok: true, claims });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon claims niet ophalen",
      details: err.message,
    });
  }
});

// approve claim
router.post("/claims/:id/approve", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).lean();
    if (!claim) {
      return res.status(404).json({
        ok: false,
        error: "Claim niet gevonden",
      });
    }

    // bedrijf verifiëren
    await Company.findByIdAndUpdate(claim.companyId, { verified: true });
    // claim verwijderen
    await Claim.findByIdAndDelete(req.params.id);

    return res.json({
      ok: true,
      message: "Claim goedgekeurd, bedrijf geverifieerd en claim verwijderd",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon claim niet goedkeuren",
      details: err.message,
    });
  }
});

// reject claim
router.post("/claims/:id/reject", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).lean();
    if (!claim) {
      return res.status(404).json({
        ok: false,
        error: "Claim niet gevonden",
      });
    }

    await Claim.findByIdAndDelete(req.params.id);

    return res.json({
      ok: true,
      message: "Claim afgewezen en verwijderd",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon claim niet afwijzen",
      details: err.message,
    });
  }
});

// GET logs – gebruikt utils/logger.getLogs()
router.get("/logs", (req, res) => {
  try {
    const logs = getLogs();
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon logs niet ophalen",
      details: err.message,
    });
  }
});

module.exports = router;
