// backend/routes/publicRequests.js

const express = require("express");
const router = express.Router();

const requestModel = require("../models/request");
const companyModel = require("../models/company");

/**
 * POST /api/publicRequests
 * Nieuwe aanvraag opslaan
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      message,
      category,
      specialty,
      context,
      city,
      postcode,
      street,
      houseNumber,
      startCompany
    } = req.body;

    if (!name || !email || !category) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const request = await requestModel.create({
      name,
      email,
      phone,
      message,
      category,
      specialty,
      context,
      city,
      postcode,
      street,
      houseNumber,
      startCompany
    });

    return res.json({ ok: true, request });

  } catch (err) {
    console.error("publicRequests POST error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/publicRequests/:id
 * Aanvraag + gefilterde bedrijven ophalen
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.length < 12) {
      return res.status(400).json({ error: "invalid request id" });
    }

    const request = await requestModel.findById(id).lean();
    if (!request) {
      return res.status(404).json({ error: "request not found" });
    }

    const requestCategory = String(request.category || "").trim().toLowerCase();
    const requestCity = String(request.city || "").trim().toLowerCase();

    // Category + city zijn verplicht → anders geen resultaten
    if (!requestCategory || !requestCity) {
      return res.json({
        request,
        companies: []
      });
    }

    const allCompanies = await companyModel.find({}).lean();

    const companies = allCompanies.filter(company => {
      const companyCity = String(company.city || "").trim().toLowerCase();
      const companyCategories = Array.isArray(company.categories)
        ? company.categories.map(c => String(c).trim().toLowerCase())
        : [];

      return (
        companyCity === requestCity &&
        companyCategories.includes(requestCategory)
      );
    });

    return res.json({
      request,
      companies
    });

  } catch (err) {
    console.error("publicRequests GET error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

/**
 * GET /api/publicRequests/latest
 * Laatste aanvragen (bijv. admin / debug)
 */
router.get("/latest", async (req, res) => {
  try {
    const requests = await requestModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.json(requests);
  } catch (err) {
    console.error("publicRequests latest error:", err);
    return res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
