// backend/routes/companiesSimilar.js
const express = require("express");
const router = express.Router();
const Company = require("../models/company");

// Endpoint: GET /api/companies-similar?anchorSlug=...
// (Backwards compatible) ook bereikbaar via:
// GET /api/companies-similar/similar?anchorSlug=...
async function handler(req, res) {
  try {
    const anchorSlug = String(req.query.anchorSlug || "").trim();
    if (!anchorSlug) {
      return res.status(400).json({ ok: false, message: "anchorSlug ontbreekt" });
    }

    const anchorCompany = await Company.findOne({
      slug: anchorSlug,
      active: true,
    })
      .select("_id name slug city categories avgRating reviewCount isVerified")
      .lean();

    if (!anchorCompany) {
      return res.status(404).json({ ok: false, message: "Ankerbedrijf niet gevonden" });
    }

    const rawCategory = Array.isArray(anchorCompany.categories)
      ? anchorCompany.categories[0]
      : null;

    const query = {
      _id: { $ne: anchorCompany._id },
      active: true,
    };

    // ✅ case-insensitive category match
    if (rawCategory) {
      query.categories = {
        $regex: `^${rawCategory}$`,
        $options: "i",
      };
    }

    const companies = await Company.find(query)
      .select("_id name slug city categories avgRating reviewCount isVerified")
      .lean();

    const sameCity = [];
    const otherCity = [];

    for (const c of companies) {
      if (
        String(c.city || "").toLowerCase() ===
        String(anchorCompany.city || "").toLowerCase()
      ) {
        sameCity.push(c);
      } else {
        otherCity.push(c);
      }
    }

    const combined = [...sameCity, ...otherCity].slice(0, 20);

    return res.json({
      ok: true,
      anchorCompany,
      companies: combined,
    });
  } catch (err) {
    console.error("companiesSimilar error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}

router.get("/", handler);
router.get("/similar", handler);

module.exports = router;
