// backend/routes/companies.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Company = require("../models/Company");
const Request = require("../models/Request");
const Review = require("../models/review");

// 📊 Dashboard voor ingelogd bedrijf
router.get("/dashboard", auth, async (req, res) => {
  try {
    // Haal bedrijf op via gekoppelde user
    const company = await Company.findOne({ user: req.user.id }).lean();
    if (!company) {
      return res.status(404).json({ success: false, error: "Bedrijf niet gevonden" });
    }

    // Update laatste inlogmoment (éénmalig per sessie)
    await Company.updateOne({ _id: company._id }, { lastLogin: new Date() });
    company.lastLogin = new Date();

    // Haal aanvragen en reviews van dit bedrijf op
    const requests = await Request.find({ company: company._id }).sort({ date: -1 }).lean();
    const reviews = await Review.find({ company: company._id }).sort({ date: -1 }).lean();

    // Statistieken berekenen
    const stats = {
      total: requests.length,
      accepted: requests.filter(r => r.status === "Geaccepteerd").length,
      rejected: requests.filter(r => r.status === "Afgewezen").length,
      followed: requests.filter(r => r.status === "Opgevolgd").length,
    };

    res.json({
      success: true,
      company,
      requests,
      reviews,
      stats,
    });
  } catch (err) {
    console.error("❌ Fout bij ophalen dashboard:", err);
    res.status(500).json({ success: false, error: "Serverfout bij ophalen dashboard" });
  }
});

// 📋 Lijst van bedrijven (openbaar)
router.get("/", async (req, res) => {
  try {
    const companies = await Company.find().select("name category email").lean();
    res.json({ success: true, companies });
  } catch (err) {
    console.error("❌ Fout bij ophalen bedrijven:", err);
    res.status(500).json({ success: false, error: "Serverfout bij ophalen bedrijven" });
  }
});

// 🧩 Bedrijf bewerken (voor profielbeheer)
router.patch("/update", auth, async (req, res) => {
  try {
    const company = await Company.findOne({ user: req.user.id });
    if (!company) {
      return res.status(404).json({ success: false, error: "Bedrijf niet gevonden" });
    }

    const allowed = ["name", "phone", "address", "website", "category"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) company[key] = req.body[key];
    }
    await company.save();

    res.json({ success: true, company });
  } catch (err) {
    console.error("❌ Fout bij bijwerken bedrijf:", err);
    res.status(500).json({ success: false, error: "Serverfout bij bijwerken bedrijfsgegevens" });
  }
});

module.exports = router;
