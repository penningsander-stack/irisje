// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const Review = require("../models/review");

// ✅ Alle bedrijven ophalen
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().lean();
    res.json(companies);
  } catch (error) {
    console.error("Fout bij ophalen bedrijven:", error);
    res.status(500).json({ message: "Serverfout" });
  }
});

// ✅ Zoeken op categorie en/of plaats
router.get("/search", async (req, res) => {
  try {
    const { category, city } = req.query;
    const query = {};
    if (category) query.categories = { $regex: category, $options: "i" };
    if (city) query.city = { $regex: city, $options: "i" };

    const companies = await Company.find(query).lean();
    res.json({
      ok: true,
      total: companies.length,
      page: 1,
      limit: companies.length,
      items: companies.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        categories: c.categories,
        city: c.city,
        avgRating: c.avgRating || 0,
        reviewCount: c.reviewCount || 0,
        isVerified: c.isVerified || false,
        website: c.website || "",
      })),
    });
  } catch (error) {
    console.error("Fout bij zoeken bedrijven:", error);
    res.status(500).json({ message: "Serverfout" });
  }
});

// ✅ Bedrijf ophalen via slug (met reviews)
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const company = await Company.findOne({ slug }).lean();

    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    const reviews = await Review.find({ company: company._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      _id: company._id,
      name: company.name,
      tagline: company.tagline || "",
      description: company.description || "Nog geen beschrijving beschikbaar.",
      address: company.address || "Adres niet opgegeven.",
      city: company.city || "",
      phone: company.phone || "Geen telefoonnummer beschikbaar.",
      website: company.website || "",
      categories: company.categories || [],
      avgRating: company.avgRating || 0,
      reviewCount: company.reviewCount || reviews.length,
      isVerified: company.isVerified || false,
      logoUrl: company.logoUrl || "",
      reviews: reviews.map((r) => ({
        name: r.name || "Anoniem",
        rating: r.rating || 0,
        message: r.message || "",
        date: r.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("Fout bij ophalen bedrijf:", error);
    res.status(500).json({ message: "Serverfout" });
  }
});

module.exports = router;
