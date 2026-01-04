// backend/routes/publicCompanies.js

const express = require("express");
const router = express.Router();

const Company = require("../models/company");
const Request = require("../models/request");

/**
 * =========================================================
 * POST /api/publicCompanies
 * Publiek: bedrijf aanmelden
 * =========================================================
 */
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const company = new Company({
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      city: data.city || "",
      categories: Array.isArray(data.categories) ? data.categories : [],
      specialties: Array.isArray(data.specialties) ? data.specialties : [],
      regions: Array.isArray(data.regions) ? data.regions : [],
      verified: false,
      source: "public",
    });

    await company.save();
    res.json({ ok: true, company });
  } catch (err) {
    console.warn("❌ publicCompanies POST:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * =========================================================
 * GET /api/publicCompanies/:id
 * Publiek: één bedrijf ophalen
 * =========================================================
 */
router.get("/:id", async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();

    if (!company) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, company });
  } catch (err) {
    console.warn("❌ publicCompanies GET :id:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * =========================================================
 * GET /api/publicCompanies
 * - zonder requestId → ALLE publieke bedrijven
 * - met requestId → matchen bij aanvraag
 * =========================================================
 */
router.get("/", async (req, res) => {
  try {
    const { requestId } = req.query;

    // 🔁 GEEN requestId → algemene lijst
    if (!requestId) {
      const companies = await Company.find({ source: "public" })
        .limit(50)
        .lean();

      return res.json({
        ok: true,
        companies,
      });
    }

    // 🎯 MET requestId → selectie bij aanvraag
    const request = await Request.findById(requestId).lean();

    if (!request) {
      return res.status(404).json({ ok: false, error: "Request not found" });
    }

    const categories =
      request.categories?.length
        ? request.categories
        : request.category
        ? [request.category]
        : [];

    const specialties =
      request.specialties?.length
        ? request.specialties
        : request.specialty
        ? [request.specialty]
        : [];

    const query = {
      $or: [
        { categories: { $in: categories } },
        { specialties: { $in: specialties } },
      ],
    };

    const companies = await Company.find(query)
      .limit(20)
      .lean();

    res.json({
      ok: true,
      request,
      companies,
    });
  } catch (err) {
    console.warn("❌ publicCompanies GET:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
