// backend/routes/companies.js
// v20260102-14D-STABLE + DASHBOARD-OWNER-GUARD

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Company = require("../models/company");
const Request = require("../models/request");
const auth = require("../middleware/auth");

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// -----------------------------------------------------------------------------
// CATEGORIEËN VOOR HOMEPAGE
// GET /api/companies/lists
// -----------------------------------------------------------------------------
router.get("/lists", async (req, res) => {
  try {
    const categories = await Company.distinct("categories");

    const cleaned = categories
      .flat()
      .filter(Boolean)
      .map((c) => c.trim())
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();

    res.json({ ok: true, categories: cleaned });
  } catch (err) {
    console.error("❌ companies/lists error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// ZOEKEN OP CATEGORY + SPECIALTY (STAP 14D)
// GET /api/companies/search
// -----------------------------------------------------------------------------
router.get("/search", async (req, res) => {
  try {
    const { category, specialty } = req.query;

    if (!category) {
      return res.json({
        ok: true,
        results: [],
        fallbackUsed: false,
        message: null,
      });
    }

    const query = {
      active: true,
      categories: { $in: [new RegExp(escapeRegex(category), "i")] },
    };

    if (specialty) {
      query.specialties = {
        $in: [new RegExp(escapeRegex(specialty), "i")],
      };
    }

    const results = await Company.find(query)
      .limit(20)
      .select("_id name city avgRating reviewCount isVerified")
      .lean();

    res.json({
      ok: true,
      results,
      fallbackUsed: false,
      message: null,
    });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMPANY VIA SLUG (publiek)
// GET /api/companies/slug/:slug
// -----------------------------------------------------------------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const item = await Company.findOne({ slug: req.params.slug }).lean();
    if (!item) {
      return res.status(404).json({
        ok: false,
        error: "Company niet gevonden.",
      });
    }
    res.json({ ok: true, item });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// COMPANY VIA ID (DASHBOARD – AUTH + OWNER)
// LET OP: MOET LAATSTE ROUTE BLIJVEN
// GET /api/companies/:id
// -----------------------------------------------------------------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        error: "Ongeldig company-id.",
      });
    }

    const item = await Company.findById(id).lean();
    if (!item) {
      return res.status(404).json({
        ok: false,
        error: "Company niet gevonden.",
      });
    }

    // Security: alleen owner mag dashboard-profiel zien
    if (String(item.owner) !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        error: "Geen toegang tot dit bedrijf.",
      });
    }

    // Beperkt profiel voor dashboard
    res.json({
      ok: true,
      item: {
        _id: item._id,
        name: item.name,
        city: item.city,
        isVerified: item.isVerified,
        avgRating: item.avgRating,
        reviewCount: item.reviewCount,
        categories: item.categories || [],
        specialties: item.specialties || [],
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -----------------------------------------------------------------------------
// SEND REQUESTS NAAR GESELECTEERDE BEDRIJVEN
// POST /api/companies/send-requests
// -----------------------------------------------------------------------------
router.post("/send-requests", async (req, res) => {
  try {
    const { requestId, companyIds } = req.body;

    if (!requestId || !Array.isArray(companyIds) || !companyIds.length) {
      return res.status(400).json({
        ok: false,
        error: "Ongeldige invoer.",
      });
    }

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({
        ok: false,
        error: "Aanvraag niet gevonden.",
      });
    }

    await Company.updateMany(
      { _id: { $in: companyIds } },
      { $addToSet: { receivedRequests: requestId } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
