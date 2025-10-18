// backend/routes/companies.js
const express = require("express");
const auth = require("../middleware/auth");
const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/review"); // ✅ kleine letters!

const router = express.Router();

/**
 * GET /api/companies/dashboard
 */
router.get("/dashboard", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) return res.status(404).json({ error: "Bedrijf niet gevonden" });

    const requests = await Request.find({ companyId }).sort({ date: -1 }).lean();
    const reviews = await Review.find({ companyId }).sort({ date: -1 }).lean();

    const stats = {
      total: requests.length,
      accepted: requests.filter((r) => r.status === "Geaccepteerd").length,
      rejected: requests.filter((r) => r.status === "Afgewezen").length,
      followed: requests.filter((r) => r.status === "Opgevolgd").length,
    };

    res.json({ success: true, stats, requests, reviews });
  } catch (err) {
    console.error("❌ Dashboard-fout:", err);
    res.status(500).json({ error: "Serverfout bij ophalen dashboardgegevens" });
  }
});

module.exports = router;
