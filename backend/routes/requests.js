// backend/routes/requests.js
// ✅ Haalt aanvragen en statistieken op per bedrijf (met fallback voor oude tokenstructuur)

const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const { verifyToken } = require("./auth");

// 📊 Statistieken-overzicht
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    // ✅ Gebruik company uit token als die bestaat, anders id
    const companyId = req.user.company || req.user.id;

    const requests = await Request.find({ company: companyId });

    const stats = {
      total: requests.length,
      accepted: requests.filter((r) => r.status === "Geaccepteerd").length,
      rejected: requests.filter((r) => r.status === "Afgewezen").length,
      followedUp: requests.filter((r) => r.status === "Opgevolgd").length,
    };

    res.json(stats);
  } catch (err) {
    console.error("❌ Statistiekfout:", err);
    res.status(500).json({ message: "Serverfout bij statistieken" });
  }
});

// 📬 Aanvragen ophalen
router.get("/", verifyToken, async (req, res) => {
  try {
    // ✅ Zelfde fix hier
    const companyId = req.user.company || req.user.id;

    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij ophalen aanvragen:", err);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

module.exports = router;
