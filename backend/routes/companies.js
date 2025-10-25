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

// ✅ Bedrijven zoeken op categorie en/of plaats
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
      items: companies.map(c => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        categories: c.categories,
        city: c.city,
        avgRating: c.avgRating || 0,
        reviewCount: c.reviewCount || 0,
        isVerified: c.isVerified || false,
      })),
    });
  } catch (error) {
    console.error("Fout bij zoeken bedrijven:", error);
    res.status(500).json({ message: "Serverfout" });
  }
});

// ✅ Bedrijf ophalen via slug + gekoppelde reviews
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const company = await Company.findOne({ slug }).lean();

    if (!company) {
      return res.status(404).json({ message: "Bedrijf niet gevonden" });
    }

    const reviews = await Review.find({ company: company._id }).lean();

    res.json({
      name: company.name,
      tagline: company.tagline,
      city: company.city,
      categories: company.categories,
      avgRating: company.avgRating || 0,
      reviewCount: company.reviewCount || reviews.length,
      description: company.description || "",
      logoUrl: company.logoUrl || "",
      isVerified: company.isVerified || false,
      reviews: reviews.map(r => ({
        name: r.name,
        rating: r.rating,
        message: r.message,
        date: r.date,
      })),
    });
  } catch (error) {
    console.error("Fout bij ophalen bedrijf:", error);
    res.status(500).json({ message: "Serverfout" });
  }
});

// 🔹 Nieuw: haal bedrijf op via e-mailadres
router.get("/byEmail/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json(company);
  } catch (err) {
    console.error("Fout bij ophalen bedrijf via e-mail:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

module.exports = router;
