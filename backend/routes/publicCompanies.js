// backend/routes/publicCompanies.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");

// GET /api/publicCompanies
router.get("/", async (req, res) => {
  try {
    const {
      category,
      specialty,
      region,
      verified,
      minRating,
      sort = "relevance",
      limit = 30,
    } = req.query;

    const query = {};

    // 🔹 FILTERS — ALLEMAAL OPTIONEEL EN VEILIG

    if (category) {
      query.categories = category;
    }

    if (specialty) {
      query.specialties = specialty;
    }

    if (region) {
      query.regions = region;
    }

    if (verified === "yes") {
      query.isVerified = true;
    }

    if (minRating) {
      query.avgRating = { $gte: Number(minRating) };
    }

    // 🔹 SORTEREN
    let sortQuery = { createdAt: -1 }; // default: nieuwste eerst

    if (sort === "rating") {
      sortQuery = { avgRating: -1 };
    } else if (sort === "reviews") {
      sortQuery = { reviewCount: -1 };
    } else if (sort === "verified") {
      sortQuery = { isVerified: -1 };
    } else if (sort === "az") {
      sortQuery = { name: 1 };
    }

    const companies = await Company.find(query)
      .sort(sortQuery)
      .limit(Number(limit));

    return res.json({
      ok: true,
      count: companies.length,
      companies,
    });
  } catch (err) {
    console.error("❌ publicCompanies error:", err);
    return res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
