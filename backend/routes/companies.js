// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Company = require("../models/Company");

/**
 * Helpers
 */
function normalizeString(value) {
  if (!value) return "";
  return String(value).trim().toLowerCase();
}

function withDefaults(company) {
  const obj = company.toObject ? company.toObject() : company;

  return {
    _id: obj._id,
    name: obj.name || "",
    slug: obj.slug || "",
    city: obj.city || "",
    description: obj.description || "",
    categories: Array.isArray(obj.categories) ? obj.categories : [],
    specialties: Array.isArray(obj.specialties) ? obj.specialties : [],
    reasons: Array.isArray(obj.reasons) ? obj.reasons : [],
    services: Array.isArray(obj.services) ? obj.services : [],
    approach: obj.approach || "",
    experience: obj.experience || "",
    involvement: obj.involvement || "",
    avgRating: obj.avgRating ?? 0,
    reviewCount: obj.reviewCount ?? 0,
    isVerified: !!obj.isVerified,
    logoUrl: obj.logoUrl || "",
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

/**
 * =========================================================
 * 1) SEARCH – MOET BOVEN /:id STAAN
 * =========================================================
 */
router.get("/search", async (req, res) => {
  try {
    const {
      category = "",
      city = "",
      q = "",
      verified = "",
      minRating = "",
      sort = "relevance",
    } = req.query;

    const filters = {};

    if (category) {
      const cat = normalizeString(category);
      filters.categories = { $in: [cat] };
    }

    if (city) {
      filters.city = new RegExp(`^${city}$`, "i");
    }

    if (verified === "true") {
      filters.isVerified = true;
    }

    if (minRating) {
      const rating = Number(minRating);
      if (!Number.isNaN(rating)) {
        filters.avgRating = { $gte: rating };
      }
    }

    if (q) {
      const regex = new RegExp(q, "i");
      filters.$or = [
        { name: regex },
        { description: regex },
        { specialties: regex },
      ];
    }

    let query = Company.find(filters);

    if (sort === "rating") query = query.sort({ avgRating: -1 });
    if (sort === "newest") query = query.sort({ createdAt: -1 });

    const companies = await query.lean();

    res.json({
      ok: true,
      results: companies.map(c => withDefaults(c)),
      fallbackUsed: false,
      message: null,
    });
  } catch (err) {
    console.error("❌ companies/search error:", err);
    res.status(500).json({ ok: false, error: "Search failed" });
  }
});

/**
 * =========================================================
 * 2) GET BY ID  ← DIT WAS DE ONTBREKENDE SCHAKEL
 * =========================================================
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: "Invalid id" });
    }

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ ok: false, error: "Company not found" });
    }

    res.json({
      ok: true,
      company: withDefaults(company),
    });
  } catch (err) {
    console.error("❌ companies/:id error:", err);
    res.status(500).json({ ok: false, error: "Failed to load company" });
  }
});

/**
 * =========================================================
 * 3) (OPTIONEEL) LIST – veilig laten bestaan
 * =========================================================
 */
router.get("/", async (_req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json({
      ok: true,
      results: companies.map(c => withDefaults(c)),
    });
  } catch (err) {
    console.error("❌ companies list error:", err);
    res.status(500).json({ ok: false, error: "Failed to load companies" });
  }
});

module.exports = router;
