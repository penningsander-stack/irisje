// backend/routes/admin.js
// v20260111-ADMIN-COMPANIES-CRUD
//
// Admin companies:
// - GET    /admin/companies
// - POST   /admin/companies        (nieuw: aanmaken)
// - PATCH  /admin/companies/:id    (bewerken)
// - DELETE /admin/companies/:id    (verwijderen)

const express = require("express");
const router = express.Router();

const { authMiddleware, requireAdmin } = require("../middleware/auth");

const Company = require("../models/company");
const Review = require("../models/review");
const Request = require("../models/request");
const Claim = require("../models/claim");
const { getLogs } = require("../utils/logger");

// ============================================================
// ADMIN AUTH – alles hieronder vereist admin
// ============================================================
router.use(authMiddleware, requireAdmin);

// ============================================================
// GET companies
// ============================================================
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

// ============================================================
// POST company (admin toevoegen)
// ============================================================
router.post("/companies", async (req, res) => {
  try {
    const {
      name,
      city,
      description,
      categories,
      specialties,
      isVerified,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Naam is verplicht",
      });
    }

    const company = await Company.create({
      name: name.trim(),
      city: typeof city === "string" ? city.trim() : "",
      description: typeof description === "string" ? description.trim() : "",
      categories: Array.isArray(categories) ? categories.map(String) : [],
      specialties: Array.isArray(specialties) ? specialties.map(String) : [],
      isVerified: typeof isVerified === "boolean" ? isVerified : false,
    });

    return res.status(201).json({
      ok: true,
      company,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon bedrijf niet aanmaken",
      details: err.message,
    });
  }
});

// ============================================================
// PATCH company (admin bewerken / verifiëren)
// ============================================================
router.patch("/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updates = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.city === "string") {
      updates.city = req.body.city.trim();
    }

    if (typeof req.body.description === "string") {
      updates.description = req.body.description.trim();
    }

    if (Array.isArray(req.body.categories)) {
      updates.categories = req.body.categories.map(String);
    }

    if (Array.isArray(req.body.specialties)) {
      updates.specialties = req.body.specialties.map(String);
    }

    if (typeof req.body.isVerified === "boolean") {
      updates.isVerified = req.body.isVerified;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Geen geldige velden om bij te werken",
      });
    }

    const company = await Company.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Bedrijf niet gevonden",
      });
    }

    return res.json({ ok: true, company });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon bedrijf niet bijwerken",
      details: err.message,
    });
  }
});

// ============================================================
// DELETE company (admin verwijderen)
// ============================================================
router.delete("/companies/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).lean();
    if (!company) {
      return res.status(404).json({
        ok: false,
        error: "Bedrijf niet gevonden",
      });
    }

    await Company.findByIdAndDelete(id);

    return res.json({
      ok: true,
      message: "Bedrijf verwijderd",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Kon bedrijf niet verwijderen",
      details: err.message,
    });
  }
});

// ============================================================
// OVERIGE ADMIN ROUTES (ongewijzigd)
// ============================================================

// reported reviews
router.get("/reported-reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ reported: true })
      .populate("companyId", "name slug")
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

// claims
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

router.post("/claims/:id/approve", async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).lean();
    if (!claim) {
      return res.status(404).json({
        ok: false,
        error: "Claim niet gevonden",
      });
    }

    await Company.findByIdAndUpdate(claim.companyId, {
      isVerified: true,
    });

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

// logs
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
