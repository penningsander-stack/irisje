// backend/routes/requests.js
const express = require("express");
const router = express.Router();
const Request = require("../models/Request");
const { verifyToken } = require("./auth");

// 📊 Overzicht
router.get("/stats/overview", verifyToken, async (req, res) => {
  try {
    const companyId = req.user.id;
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
    const companyId = req.user.id;
    const requests = await Request.find({ company: companyId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("❌ Fout bij aanvragen:", err);
    res.status(500).json({ message: "Serverfout bij ophalen aanvragen" });
  }
});

module.exports = router;
