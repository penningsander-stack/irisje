const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

// Alle bedrijven (voor test)
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Serverfout" });
  }
});

// ✅ Bedrijf ophalen via slug
router.get("/:slug", async (req, res) => {
  try {
    const company = await Company.findOne({ slug: req.params.slug }).lean();

    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    res.json({
      name: company.name,
      tagline: company.tagline,
      city: company.city,
      categories: company.categories,
      avgRating: company.avgRating || 0,
      reviewCount: company.reviewCount || 0,
      description: company.description || "",
      logoUrl: company.logoUrl || "",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Serverfout" });
  }
});

module.exports = router;
