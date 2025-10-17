// backend/routes/secure.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("./auth");
const Company = require("../models/Company");

router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const company = await Company.findById(userId);
    res.json({
      email: req.user.email,
      company: company
        ? { name: company.name, category: company.category }
        : { name: "Demo Bedrijf", category: "Algemeen" },
    });
  } catch (err) {
    console.error("❌ /secure/me fout:", err);
    res.status(500).json({ message: "Serverfout bij ophalen profiel" });
  }
});

module.exports = router;
