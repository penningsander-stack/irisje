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

// ✅ Nieuw bedrijf toevoegen (optioneel, voor beheerder)
router.post("/", async (req, res) => {
  try {
    const { name, slug, tagline, categories, city, description, logoUrl } = req.body;
    const newCompany = new Company({
      name,
      slug,
      tagline,
      categories,
      city,
      description,
      logoUrl,
      avgRating: 0,
      reviewCount: 0,
      isVerified: false,
    });
    await newCompany.save();
    res.json({ message: "Bedrijf toegevoegd", company: newCompany });
  } catch (error) {
    console.error("Fout bij toevoegen bedrijf:", error);
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

    // Alle reviews ophalen die bij dit bedrijf horen
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

module.exports = router;
