// backend/routes/companies.js
const express = require("express");
const auth = require("../middleware/auth");
const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/Review");

const router = express.Router();

// Dashboarddata ophalen
router.get("/dashboard", auth, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const requests = await Request.find({ companyId }).sort({ date: -1 });
    const reviews = await Review.find({ companyId }).sort({ date: -1 });

    const stats = {
      total: requests.length,
      accepted: requests.filter((r) => r.status === "Geaccepteerd").length,
      rejected: requests.filter((r) => r.status === "Afgewezen").length,
      followed: requests.filter((r) => r.status === "Opgevolgd").length,
    };

    res.json({ stats, requests, reviews });
  } catch (err) {
    console.error("❌ Dashboard-fout:", err);
    res.status(500).json({ error: "Serverfout bij ophalen dashboardgegevens" });
  }
});

module.exports = router;
