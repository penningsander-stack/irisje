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

// ✅ Bedrijf ophalen via e-mailadres
router.get("/byEmail/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const company = await Company.findOne({ email }).lean();
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });
    res.json(company);
  } catch (err) {
    console.error("Fout bij ophalen bedrijf via e-mail:", err);
    res.status(500).json({ error: "Serverfout" });
  }
});

// ✅ Bedrijven ophalen via eigenaar (beheerfunctie)
router.get("/byOwner/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase();

    // Beheerder ziet alles
    if (email === "info@irisje.nl") {
      const allCompanies = await Company.find().lean();
      return res.json(allCompanies);
    }

    const companies = await Company.find({ ownerEmail: email }).lean();
    if (!companies.length) {
      return res.status(404).json({ error: "Geen bedrijven gevonden voor deze eigenaar." });
    }

    res.json(companies);
  } catch (err) {
    console.error("Fout bij ophalen bedrijven via eigenaar:", err);
    res.status(500).json({ error: "Serverfout" });
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

    const reviews = await Review.find({ company: company._id }).lean();

    res.json({
      ok: true,
      company: {
        _id: company._id,
        name: company.name,
        tagline: company.tagline,
        description: company.description || "",
        address: company.address || "",
        city: company.city || "",
        phone: company.phone || "",
        website: company.website || "",
        categories: company.categories || [],
        avgRating: company.avgRating || 0,
        reviewCount: company.reviewCount || reviews.length,
        isVerified: company.isVerified || false,
        logoUrl: company.logoUrl || "",
      },
      reviews: reviews.map((r) => ({
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
